/**
 * A2A Protocol Server
 *
 * A complete A2A server framework for building self-hosted agents.
 * Users only implement a message handler - the server manages tasks internally.
 *
 * @see https://a2a-protocol.org/latest/specification/
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server,
} from "http";
import type {
  AgentCard,
  Message,
  Part,
  Task,
  TaskState,
  StreamEvent,
  TaskStatusUpdateEvent,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  ListTasksParams,
  TaskContext,
  TaskYieldUpdate,
} from "./types.js";
import { A2AErrorCodes } from "./types.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Message handler function type (low-level API).
 * Can be either:
 * - An async generator that yields StreamEvents (for streaming responses)
 * - A promise that returns a Message (for simple request/response)
 */
export type MessageHandler = (
  message: Message,
) => AsyncGenerator<StreamEvent> | Promise<Message>;

/**
 * Task handler function type (developer-friendly API).
 * Receives a TaskContext and yields TaskYieldUpdate objects.
 * This is the recommended API for most use cases.
 */
export type TaskHandler = (
  context: TaskContext,
) => AsyncGenerator<TaskYieldUpdate>;

/**
 * Configuration for the A2A server.
 * Supports two APIs:
 * - Developer-friendly: Use `handler` with TaskContext/TaskYieldUpdate
 * - Low-level: Use `handleMessage` with Message/StreamEvent
 */
export interface A2AServerConfig {
  /** The agent card describing this agent */
  agentCard: AgentCard;

  /**
   * Task handler function (developer-friendly API).
   * Receives TaskContext and yields TaskYieldUpdate.
   * Use this for most use cases.
   */
  handler?: TaskHandler;

  /**
   * Message handler function (low-level API).
   * Receives raw Message and yields StreamEvent.
   * Use this for advanced use cases requiring full control.
   * @deprecated Use `handler` instead for simpler API
   */
  handleMessage?: MessageHandler;

  /**
   * Custom task store (optional).
   * If not provided, an in-memory store is used.
   * @deprecated Task storage is managed internally. This option is ignored.
   */
  taskStore?: InMemoryTaskStore;

  /** Enable CORS headers (default: true) */
  cors?: boolean;
}

/**
 * HTTP request handler type for custom server integration.
 */
export type A2ARequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void>;

// =============================================================================
// Message Normalization (handle both 'kind' and 'type' discriminators)
// =============================================================================

/**
 * Normalize a message part to use 'type' discriminator internally.
 * The A2A Python SDK uses 'kind', but we use 'type' internally.
 */
function normalizePart(part: Part | Record<string, unknown>): Part {
  const p = part as Record<string, unknown>;
  // If part has 'kind' but no 'type', convert it
  if ("kind" in p && !("type" in p)) {
    const { kind, ...rest } = p;
    return { type: kind, ...rest } as Part;
  }
  return part as Part;
}

/**
 * Normalize a message to use 'type' discriminator internally.
 */
function normalizeMessage(message: Message): Message {
  if (!message.parts) return message;
  return {
    ...message,
    parts: message.parts.map((part) => normalizePart(part)),
  };
}

/**
 * Convert a part to use 'kind' discriminator for A2A Python SDK compatibility.
 */
function partToKind(part: Part): Record<string, unknown> {
  const p = part as unknown as Record<string, unknown>;
  if ("type" in p && !("kind" in p)) {
    const { type, ...rest } = p;
    return { kind: type, ...rest };
  }
  return p;
}

/**
 * Convert a message to use 'kind' discriminator for A2A Python SDK compatibility.
 */
function messageToKind(message: Message): Record<string, unknown> {
  const m = message as unknown as Record<string, unknown>;
  return {
    ...message,
    kind: "message",
    message_id: m.message_id || m.messageId || crypto.randomUUID(),
    parts: message.parts.map((part) => partToKind(part)),
  };
}

/**
 * Convert a task to A2A format for responses.
 */
function taskToA2AFormat(task: Task): Record<string, unknown> {
  const result: Record<string, unknown> = {
    id: task.id,
    contextId: task.contextId || task.id, // A2A spec requires contextId
    status: {
      state: task.state,
      timestamp: task.updatedAt || new Date().toISOString(),
    },
    kind: "task",
  };

  if (task.messages && task.messages.length > 0) {
    result.history = task.messages.map(messageToKind);
  }
  if (task.artifacts) result.artifacts = task.artifacts;
  if (task.metadata) result.metadata = task.metadata;

  return result;
}

/**
 * Create a TaskStatusUpdateEvent in A2A format.
 */
function createA2AStatusEvent(
  taskId: string,
  state: TaskState,
  contextId?: string,
  message?: Message,
  isFinal: boolean = false,
): Record<string, unknown> {
  const status: Record<string, unknown> = {
    state,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    status.message = messageToKind(message);
  }

  return {
    kind: "status-update",
    task_id: taskId,
    context_id: contextId || taskId, // Use taskId as fallback for context_id
    status,
    final: isFinal,
  };
}

// =============================================================================
// Task Storage
// =============================================================================

interface TaskStore {
  tasks: Map<string, Task>;
  taskCounter: number;
  subscribers: Map<string, Set<(event: StreamEvent) => void>>;
}

/**
 * In-memory task store for the A2A server.
 * This class is exported for template compatibility but task storage
 * is managed internally by the server.
 *
 * @example
 * ```typescript
 * const server = new A2AServer({
 *   agentCard: { ... },
 *   taskStore: new InMemoryTaskStore(), // Optional, for template compatibility
 *   handler: async function* (context) { ... }
 * });
 * ```
 */
export class InMemoryTaskStore implements TaskStore {
  tasks: Map<string, Task> = new Map();
  taskCounter: number = 0;
  subscribers: Map<string, Set<(event: StreamEvent) => void>> = new Map();
}

function createTaskStore(): TaskStore {
  return new InMemoryTaskStore();
}

function createTask(store: TaskStore, message: Message): Task {
  const taskId = `task-${++store.taskCounter}`;
  const now = new Date().toISOString();
  // Use message contextId or generate one (A2A spec requires context_id)
  const contextId = message.contextId || crypto.randomUUID();
  const task: Task = {
    id: taskId,
    state: "submitted",
    contextId,
    messages: [message],
    createdAt: now,
    updatedAt: now,
  };
  store.tasks.set(taskId, task);
  return task;
}

function updateTaskState(
  store: TaskStore,
  taskId: string,
  state: TaskState,
  message?: Message,
): Task | null {
  const task = store.tasks.get(taskId);
  if (!task) return null;

  task.state = state;
  task.updatedAt = new Date().toISOString();
  if (message) {
    task.messages = [...(task.messages || []), message];
  }
  store.tasks.set(taskId, task);
  return task;
}

function notifySubscribers(
  store: TaskStore,
  taskId: string,
  event: StreamEvent,
): void {
  const subscribers = store.subscribers.get(taskId);
  if (subscribers) {
    for (const callback of subscribers) {
      callback(event);
    }
  }
}

function addSubscriber(
  store: TaskStore,
  taskId: string,
  callback: (event: StreamEvent) => void,
): () => void {
  if (!store.subscribers.has(taskId)) {
    store.subscribers.set(taskId, new Set());
  }
  store.subscribers.get(taskId)!.add(callback);

  // Return unsubscribe function
  return () => {
    store.subscribers.get(taskId)?.delete(callback);
  };
}

// =============================================================================
// SSE Utilities
// =============================================================================

function writeSSEHeaders(res: ServerResponse): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
}

function writeSSEEvent(res: ServerResponse, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function writeSSEDone(res: ServerResponse): void {
  // Just close the connection - A2A Python SDK doesn't expect [DONE] marker
  res.end();
}

// =============================================================================
// JSON-RPC Utilities
// =============================================================================

function createJsonRpcSuccess<T>(
  result: T,
  id: string | number,
): JsonRpcSuccessResponse<T> {
  return { jsonrpc: "2.0", result, id };
}

function createJsonRpcError(
  code: number,
  message: string,
  id: string | number | null,
): JsonRpcErrorResponse {
  return { jsonrpc: "2.0", error: { code, message }, id };
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// =============================================================================
// A2A Server Class
// =============================================================================

/** Internal config type with resolved handler */
interface ResolvedA2AServerConfig {
  agentCard: AgentCard;
  handleMessage: MessageHandler;
  cors: boolean;
}

/**
 * A2A Protocol Server.
 *
 * Handles all A2A protocol endpoints including streaming.
 * Users only need to implement a task handler.
 *
 * @example
 * ```typescript
 * const server = new A2AServer({
 *   agentCard: {
 *     name: "My Agent",
 *     url: "http://localhost:3000",
 *     capabilities: { streaming: true }
 *   },
 *   handler: async function* (context) {
 *     const userMessage = context.message.parts
 *       .filter((p) => p.type === "text")
 *       .map((p) => p.text)
 *       .join("\n");
 *
 *     yield {
 *       state: "completed",
 *       message: { role: "agent", parts: [{ type: "text", text: `Echo: ${userMessage}` }] }
 *     };
 *   }
 * });
 *
 * server.start();
 * ```
 */
export class A2AServer {
  private readonly config: ResolvedA2AServerConfig;
  private readonly store: TaskStore;
  private server: Server | null = null;

  constructor(config: A2AServerConfig) {
    // Validate that either handler or handleMessage is provided
    if (!config.handler && !config.handleMessage) {
      throw new Error(
        "A2AServerConfig must provide either 'handler' or 'handleMessage'",
      );
    }

    // Apply defaults to agentCard
    const agentCard: AgentCard = {
      ...config.agentCard,
      defaultInputModes: config.agentCard.defaultInputModes ?? ["text"],
      defaultOutputModes: config.agentCard.defaultOutputModes ?? ["text"],
    };

    // Convert handler to handleMessage if needed
    const handleMessage: MessageHandler = config.handleMessage
      ? config.handleMessage
      : this.wrapTaskHandler(config.handler!);

    this.config = {
      agentCard,
      handleMessage,
      cors: config.cors ?? true,
    };
    this.store = config.taskStore ?? createTaskStore();
  }

  /**
   * Wrap a TaskHandler into a MessageHandler.
   * Converts TaskContext/TaskYieldUpdate API to Message/StreamEvent API.
   */
  private wrapTaskHandler(handler: TaskHandler): MessageHandler {
    return (message: Message) => {
      // Create a placeholder task for the context
      // The actual task will be created by handleSendMessage
      const placeholderTask: Task = {
        id: "pending",
        state: "submitted",
        contextId: message.contextId,
        messages: [message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const context: TaskContext = {
        task: placeholderTask,
        message,
      };

      // Return an async generator that converts TaskYieldUpdate to StreamEvent
      return (async function* () {
        for await (const update of handler(context)) {
          const event: TaskStatusUpdateEvent = {
            type: "task_status_update",
            taskId: placeholderTask.id,
            state: update.state,
            message: update.message,
            timestamp: new Date().toISOString(),
          };
          yield event;
        }
      })();
    };
  }

  /**
   * Start the server on port 3000.
   * Convenience method equivalent to `listen(3000)`.
   */
  start(): void {
    this.listen(3000);
    console.log("Agent server running on http://localhost:3000");
  }

  /**
   * Start the server listening on the specified port.
   */
  listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch((error) => {
          console.error("Request error:", error);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
      });

      this.server.listen(port, () => {
        resolve();
      });
    });
  }

  /**
   * Get the HTTP request handler for custom server integration.
   * Use this to integrate with Express, Fastify, or other HTTP frameworks.
   */
  getHandler(): A2ARequestHandler {
    return (req, res) => this.handleRequest(req, res);
  }

  /**
   * Gracefully close the server.
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get the current agent card.
   */
  getAgentCard(): AgentCard {
    return this.config.agentCard;
  }

  /**
   * Update the agent card.
   * Can pass a partial update or a function that receives the current card and returns the updated card.
   *
   * @example
   * // Partial update
   * server.updateAgentCard({ description: "Updated description" });
   *
   * // Function update
   * server.updateAgentCard((card) => ({
   *   ...card,
   *   skills: [...(card.skills || []), newSkill],
   * }));
   */
  updateAgentCard(
    update: Partial<AgentCard> | ((current: AgentCard) => AgentCard),
  ): AgentCard {
    if (typeof update === "function") {
      this.config.agentCard = update(this.config.agentCard);
    } else {
      this.config.agentCard = { ...this.config.agentCard, ...update };
    }
    return this.config.agentCard;
  }

  /**
   * Main request handler.
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // CORS headers
    if (this.config.cors) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, A2A-Version, Accept",
      );
    }

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Agent card discovery (support both with and without .json extension)
    if (
      (url.pathname === "/.well-known/agent-card.json" ||
        url.pathname === "/.well-known/agent-card") &&
      req.method === "GET"
    ) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(this.config.agentCard, null, 2));
      return;
    }

    // JSON-RPC endpoint
    if (url.pathname === "/" && req.method === "POST") {
      await this.handleJsonRpc(req, res);
      return;
    }

    // 404 for everything else
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }

  /**
   * Handle JSON-RPC requests.
   */
  private async handleJsonRpc(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    let request: JsonRpcRequest;

    try {
      const body = await readRequestBody(req);
      request = JSON.parse(body) as JsonRpcRequest;
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          createJsonRpcError(A2AErrorCodes.PARSE_ERROR, "Parse error", null),
        ),
      );
      return;
    }

    try {
      let response: JsonRpcResponse;

      // Support multiple method naming conventions:
      // - Official A2A spec: "message/send", "message/stream", "tasks/get", etc.
      // - Legacy/alternative: "a2a.SendMessage", "SendMessage", etc.
      switch (request.method) {
        // Agent card
        case "agent/authenticatedExtendedCard":
        case "GetExtendedAgentCard":
        case "a2a.GetExtendedAgentCard":
          response = createJsonRpcSuccess(this.config.agentCard, request.id);
          break;

        // Send message (non-streaming)
        case "message/send":
        case "SendMessage":
        case "a2a.SendMessage":
          response = await this.handleSendMessage(request);
          break;

        // Send message (streaming)
        case "message/stream":
        case "SendStreamingMessage":
        case "a2a.SendStreamingMessage":
          await this.handleSendStreamingMessage(request, res);
          return; // Streaming handles its own response

        // Get task
        case "tasks/get":
        case "GetTask":
        case "a2a.GetTask":
          response = this.handleGetTask(request);
          break;

        // List tasks (not in official spec but useful)
        case "tasks/list":
        case "ListTasks":
        case "a2a.ListTasks":
          response = this.handleListTasks(request);
          break;

        // Cancel task
        case "tasks/cancel":
        case "CancelTask":
        case "a2a.CancelTask":
          response = this.handleCancelTask(request);
          break;

        // Subscribe to task / resubscribe
        case "tasks/resubscribe":
        case "SubscribeToTask":
        case "a2a.SubscribeToTask":
          await this.handleSubscribeToTask(request, res);
          return; // Streaming handles its own response

        default:
          response = createJsonRpcError(
            A2AErrorCodes.METHOD_NOT_FOUND,
            `Method not found: ${request.method}`,
            request.id,
          );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          createJsonRpcError(A2AErrorCodes.INTERNAL_ERROR, message, request.id),
        ),
      );
    }
  }

  /**
   * Handle a2a.SendMessage - non-streaming message handling.
   */
  private async handleSendMessage(
    request: JsonRpcRequest,
  ): Promise<JsonRpcResponse> {
    const params = request.params as { message: Message };
    const message = normalizeMessage(params.message);

    // Create task
    const task = createTask(this.store, message);

    // Call handler
    const result = this.config.handleMessage(message);

    // Check if it's an async generator or a promise
    if (Symbol.asyncIterator in result) {
      // It's an async generator - consume it and update task
      for await (const event of result as AsyncGenerator<StreamEvent>) {
        if (event.type === "task_status_update") {
          const statusEvent = event as TaskStatusUpdateEvent;
          updateTaskState(
            this.store,
            task.id,
            statusEvent.state,
            statusEvent.message,
          );
        }
        notifySubscribers(this.store, task.id, { ...event, taskId: task.id });
      }

      const updatedTask = this.store.tasks.get(task.id)!;
      return createJsonRpcSuccess(taskToA2AFormat(updatedTask), request.id);
    } else {
      // It's a promise - wait for response message
      const responseMessage = await result;
      updateTaskState(this.store, task.id, "completed", responseMessage);

      const updatedTask = this.store.tasks.get(task.id)!;
      return createJsonRpcSuccess(taskToA2AFormat(updatedTask), request.id);
    }
  }

  /**
   * Handle a2a.SendStreamingMessage - streaming message handling.
   */
  private async handleSendStreamingMessage(
    request: JsonRpcRequest,
    res: ServerResponse,
  ): Promise<void> {
    const params = request.params as { message: Message };
    const message = normalizeMessage(params.message);

    // Create task
    const task = createTask(this.store, message);

    // Set up SSE
    writeSSEHeaders(res);

    // Helper to wrap event in JSON-RPC response format
    const writeJsonRpcEvent = (result: unknown) => {
      writeSSEEvent(res, {
        jsonrpc: "2.0",
        id: request.id,
        result,
      });
    };

    // Send initial task created event (A2A format wrapped in JSON-RPC)
    writeJsonRpcEvent(
      createA2AStatusEvent(task.id, "submitted", task.contextId),
    );

    // Call handler
    const result = this.config.handleMessage(message);

    try {
      if (Symbol.asyncIterator in result) {
        // Stream events from async generator
        for await (const event of result as AsyncGenerator<StreamEvent>) {
          if (event.type === "task_status_update") {
            const statusEvent = event as TaskStatusUpdateEvent;
            updateTaskState(
              this.store,
              task.id,
              statusEvent.state,
              statusEvent.message,
            );

            // Send A2A format event wrapped in JSON-RPC
            const terminalStates: TaskState[] = [
              "completed",
              "failed",
              "cancelled",
              "rejected",
            ];
            const isFinal = terminalStates.includes(statusEvent.state);
            writeJsonRpcEvent(
              createA2AStatusEvent(
                task.id,
                statusEvent.state,
                task.contextId,
                statusEvent.message,
                isFinal,
              ),
            );

            // Also notify internal subscribers
            const internalEvent = { ...event, taskId: task.id };
            notifySubscribers(this.store, task.id, internalEvent);
          } else {
            // Artifact events
            writeJsonRpcEvent({ ...event, taskId: task.id });
            notifySubscribers(this.store, task.id, {
              ...event,
              taskId: task.id,
            });
          }
        }
      } else {
        // Promise - send working then completed
        writeJsonRpcEvent(
          createA2AStatusEvent(task.id, "working", task.contextId),
        );
        updateTaskState(this.store, task.id, "working");

        const responseMessage = await result;
        writeJsonRpcEvent(
          createA2AStatusEvent(
            task.id,
            "completed",
            task.contextId,
            responseMessage,
            true,
          ),
        );
        updateTaskState(this.store, task.id, "completed", responseMessage);
      }
    } catch {
      writeJsonRpcEvent(
        createA2AStatusEvent(
          task.id,
          "failed",
          task.contextId,
          undefined,
          true,
        ),
      );
      updateTaskState(this.store, task.id, "failed");
    }

    writeSSEDone(res);
  }

  /**
   * Handle a2a.GetTask.
   */
  private handleGetTask(request: JsonRpcRequest): JsonRpcResponse {
    const params = request.params as { id?: string; name?: string };
    // Support both 'id' and 'name' params, and handle 'tasks/' prefix
    const rawId = params.id || params.name || "";
    const taskId = rawId.replace("tasks/", "");

    const task = this.store.tasks.get(taskId);
    if (!task) {
      return createJsonRpcError(
        A2AErrorCodes.TASK_NOT_FOUND,
        `Task not found: ${taskId}`,
        request.id,
      );
    }

    return createJsonRpcSuccess(taskToA2AFormat(task), request.id);
  }

  /**
   * Handle a2a.ListTasks.
   */
  private handleListTasks(request: JsonRpcRequest): JsonRpcResponse {
    const params = (request.params || {}) as ListTasksParams;
    let tasks = Array.from(this.store.tasks.values());

    // Filter by contextId
    if (params.contextId) {
      tasks = tasks.filter((t) => t.contextId === params.contextId);
    }

    // Filter by status
    if (params.status) {
      const statuses = Array.isArray(params.status)
        ? params.status
        : [params.status];
      tasks = tasks.filter((t) => statuses.includes(t.state));
    }

    // Pagination
    const pageSize = params.pageSize || 10;
    tasks = tasks.slice(0, pageSize);

    return createJsonRpcSuccess(
      { tasks: tasks.map(taskToA2AFormat) },
      request.id,
    );
  }

  /**
   * Handle a2a.CancelTask.
   */
  private handleCancelTask(request: JsonRpcRequest): JsonRpcResponse {
    const params = request.params as {
      id?: string;
      name?: string;
      reason?: string;
    };
    const rawId = params.id || params.name || "";
    const taskId = rawId.replace("tasks/", "");

    const task = this.store.tasks.get(taskId);
    if (!task) {
      return createJsonRpcError(
        A2AErrorCodes.TASK_NOT_FOUND,
        `Task not found: ${taskId}`,
        request.id,
      );
    }

    updateTaskState(this.store, taskId, "cancelled");

    // Notify subscribers
    const cancelEvent: TaskStatusUpdateEvent = {
      type: "task_status_update",
      taskId,
      state: "cancelled",
      timestamp: new Date().toISOString(),
    };
    notifySubscribers(this.store, taskId, cancelEvent);

    const updatedTask = this.store.tasks.get(taskId)!;
    return createJsonRpcSuccess(taskToA2AFormat(updatedTask), request.id);
  }

  /**
   * Handle a2a.SubscribeToTask - streaming task subscription.
   */
  private async handleSubscribeToTask(
    request: JsonRpcRequest,
    res: ServerResponse,
  ): Promise<void> {
    const params = request.params as {
      id?: string;
      name?: string;
      lastEventId?: string;
    };
    const rawId = params.id || params.name || "";
    const taskId = rawId.replace("tasks/", "");

    const task = this.store.tasks.get(taskId);
    if (!task) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          createJsonRpcError(
            A2AErrorCodes.TASK_NOT_FOUND,
            `Task not found: ${taskId}`,
            request.id,
          ),
        ),
      );
      return;
    }

    // Set up SSE
    writeSSEHeaders(res);

    // Helper to wrap event in JSON-RPC response format
    const writeJsonRpcEvent = (result: unknown) => {
      writeSSEEvent(res, {
        jsonrpc: "2.0",
        id: request.id,
        result,
      });
    };

    // Terminal states
    const terminalStates: TaskState[] = [
      "completed",
      "failed",
      "cancelled",
      "rejected",
    ];

    // Send current state in A2A format wrapped in JSON-RPC
    const isFinal = terminalStates.includes(task.state);
    writeJsonRpcEvent(
      createA2AStatusEvent(
        taskId,
        task.state,
        task.contextId,
        undefined,
        isFinal,
      ),
    );

    // If already in terminal state, end stream
    if (isFinal) {
      writeSSEDone(res);
      return;
    }

    // Subscribe to updates
    const unsubscribe = addSubscriber(this.store, taskId, (event) => {
      // Convert internal events to A2A format wrapped in JSON-RPC
      if (event.type === "task_status_update") {
        const statusEvent = event as TaskStatusUpdateEvent;
        const isTerminal = terminalStates.includes(statusEvent.state);
        writeJsonRpcEvent(
          createA2AStatusEvent(
            taskId,
            statusEvent.state,
            task.contextId,
            statusEvent.message,
            isTerminal,
          ),
        );

        // End stream on terminal state
        if (isTerminal) {
          writeSSEDone(res);
          unsubscribe();
        }
      } else {
        // Pass through other events (artifacts, etc.) wrapped in JSON-RPC
        writeJsonRpcEvent(event);
      }
    });

    // Handle client disconnect
    res.on("close", () => {
      unsubscribe();
    });
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new A2A server.
 *
 * @param config - Server configuration
 * @returns A configured A2A server
 *
 * @example
 * ```typescript
 * const server = createA2AServer({
 *   agentCard: {
 *     name: "My Agent",
 *     url: "http://localhost:3000",
 *     defaultInputModes: ["text"],
 *     defaultOutputModes: ["text"],
 *   },
 *   async *handleMessage(message) {
 *     yield { type: "task_status_update", state: "working", timestamp: new Date().toISOString() };
 *     const text = message.parts.find(p => p.type === "text")?.text ?? "";
 *     yield {
 *       type: "task_status_update",
 *       state: "completed",
 *       message: { role: "agent", parts: [{ type: "text", text: `Echo: ${text}` }] },
 *       timestamp: new Date().toISOString()
 *     };
 *   }
 * });
 *
 * await server.listen(3000);
 * console.log("Server running on http://localhost:3000");
 * ```
 */
export function createA2AServer(config: A2AServerConfig): A2AServer {
  return new A2AServer(config);
}
