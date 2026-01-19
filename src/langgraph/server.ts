/**
 * LangGraph Protocol Server
 *
 * A minimal LangGraph Platform API-compatible server that wraps
 * the A2A TaskHandler, allowing agents to be consumed by LangGraph SDK clients.
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server,
} from "http";
import type { TaskHandler } from "../a2a/server.js";
import type { AgentCard, Message, TaskContext, Task } from "../a2a/types.js";
import type {
  LangGraphAssistant,
  LangGraphThread,
  LangGraphThreadState,
  LangGraphRun,
  LangGraphMessage,
  RunCreateRequest,
  ThreadCreateRequest,
  ServerInfo,
} from "./types.js";

// =============================================================================
// Storage
// =============================================================================

interface LangGraphStore {
  assistants: Map<string, LangGraphAssistant>;
  threads: Map<string, LangGraphThread>;
  threadStates: Map<string, LangGraphThreadState>;
  runs: Map<string, LangGraphRun>;
  runCounter: number;
}

function createStore(): LangGraphStore {
  return {
    assistants: new Map(),
    threads: new Map(),
    threadStates: new Map(),
    runs: new Map(),
    runCounter: 0,
  };
}

// =============================================================================
// Message Conversion
// =============================================================================

/**
 * Convert A2A Message to LangGraph Message format.
 */
function a2aToLangGraphMessage(msg: Message): LangGraphMessage {
  const textParts = msg.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text);

  return {
    type: msg.role === "user" ? "human" : "ai",
    content: textParts.join("\n"),
    id: crypto.randomUUID(),
  };
}

/**
 * Convert LangGraph Message to A2A Message format.
 */
function langGraphToA2AMessage(msg: LangGraphMessage): Message {
  const content =
    typeof msg.content === "string"
      ? msg.content
      : msg.content
          .filter((c) => c.type === "text")
          .map((c) => c.text || "")
          .join("\n");

  return {
    role: msg.type === "human" ? "user" : "agent",
    parts: [{ type: "text", text: content }],
  };
}

/**
 * Convert run input to A2A Message.
 */
function inputToA2AMessage(input: Record<string, unknown>): Message {
  // Handle common input formats
  if ("messages" in input && Array.isArray(input.messages)) {
    const lastMessage = input.messages[input.messages.length - 1];
    if (lastMessage) {
      return langGraphToA2AMessage(lastMessage as LangGraphMessage);
    }
  }

  if ("message" in input && typeof input.message === "string") {
    return {
      role: "user",
      parts: [{ type: "text", text: input.message }],
    };
  }

  if ("content" in input && typeof input.content === "string") {
    return {
      role: "user",
      parts: [{ type: "text", text: input.content }],
    };
  }

  if ("text" in input && typeof input.text === "string") {
    return {
      role: "user",
      parts: [{ type: "text", text: input.text }],
    };
  }

  // Fallback: stringify the input
  return {
    role: "user",
    parts: [{ type: "text", text: JSON.stringify(input) }],
  };
}

// =============================================================================
// HTTP Utilities
// =============================================================================

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, message: string, status = 400): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

function writeSSE(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration for the LangGraph server.
 */
export interface LangGraphServerConfig {
  /** The agent card describing this agent */
  agentCard: AgentCard;

  /** Task handler function */
  handler: TaskHandler;

  /** Enable CORS headers (default: true) */
  cors?: boolean;
}

// =============================================================================
// LangGraph Server
// =============================================================================

/**
 * LangGraph Protocol Server.
 *
 * Provides a LangGraph Platform API-compatible interface for agents,
 * allowing them to be consumed by LangGraph SDK clients.
 *
 * @example
 * ```typescript
 * const server = new LangGraphServer({
 *   agentCard: {
 *     name: "My Agent",
 *     url: "http://localhost:3000",
 *   },
 *   handler: async function* (context) {
 *     yield {
 *       state: "completed",
 *       message: { role: "agent", parts: [{ type: "text", text: "Hello!" }] }
 *     };
 *   }
 * });
 *
 * await server.listen(3000);
 * ```
 */
export class LangGraphServer {
  private readonly config: LangGraphServerConfig;
  private readonly store: LangGraphStore;
  private server: Server | null = null;
  private readonly assistantId: string;

  constructor(config: LangGraphServerConfig) {
    if (!config.handler) {
      throw new Error("LangGraphServerConfig must provide a 'handler'");
    }

    this.config = {
      ...config,
      cors: config.cors ?? true,
    };
    this.store = createStore();

    // Create a default assistant from the agent card
    this.assistantId = crypto.randomUUID();
    const now = new Date().toISOString();
    this.store.assistants.set(this.assistantId, {
      assistant_id: this.assistantId,
      graph_id: "agent",
      name: config.agentCard.name,
      description: config.agentCard.description,
      config: {},
      metadata: {
        a2a_url: config.agentCard.url,
        capabilities: config.agentCard.capabilities,
        skills: config.agentCard.skills,
      },
      created_at: now,
      updated_at: now,
      version: 1,
    });
  }

  /**
   * Start the server listening on the specified port.
   */
  listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch((error) => {
          console.error("LangGraph request error:", error);
          if (!res.headersSent) {
            sendError(res, "Internal server error", 500);
          }
        });
      });

      this.server.listen(port, () => {
        resolve();
      });
    });
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
   * Get the HTTP request handler for custom server integration.
   */
  getHandler(): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
    return (req, res) => this.handleRequest(req, res);
  }

  /**
   * Main request handler.
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method || "GET";

    // CORS headers
    if (this.config.cors) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Api-Key",
      );
    }

    // Handle preflight
    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Route requests
    try {
      // Server info
      if (path === "/info" && method === "GET") {
        return this.handleInfo(res);
      }
      if (path === "/ok" && method === "GET") {
        return sendJson(res, { ok: true });
      }

      // Assistants
      if (path === "/assistants/search" && method === "POST") {
        return this.handleAssistantsSearch(req, res);
      }
      if (path.match(/^\/assistants\/[^/]+$/) && method === "GET") {
        const id = path.split("/")[2];
        return this.handleGetAssistant(id, res);
      }

      // Threads
      if (path === "/threads" && method === "POST") {
        return this.handleCreateThread(req, res);
      }
      if (path === "/threads/search" && method === "POST") {
        return this.handleThreadsSearch(req, res);
      }
      if (path.match(/^\/threads\/[^/]+$/) && method === "GET") {
        const id = path.split("/")[2];
        return this.handleGetThread(id, res);
      }
      if (path.match(/^\/threads\/[^/]+$/) && method === "DELETE") {
        const id = path.split("/")[2];
        return this.handleDeleteThread(id, res);
      }
      if (path.match(/^\/threads\/[^/]+\/state$/) && method === "GET") {
        const id = path.split("/")[2];
        return this.handleGetThreadState(id, res);
      }

      // Runs - stateless
      if (path === "/runs/stream" && method === "POST") {
        return this.handleRunStream(req, res, null);
      }
      if (path === "/runs/wait" && method === "POST") {
        return this.handleRunWait(req, res, null);
      }

      // Runs - on thread
      if (path.match(/^\/threads\/[^/]+\/runs\/stream$/) && method === "POST") {
        const threadId = path.split("/")[2];
        return this.handleRunStream(req, res, threadId);
      }
      if (path.match(/^\/threads\/[^/]+\/runs\/wait$/) && method === "POST") {
        const threadId = path.split("/")[2];
        return this.handleRunWait(req, res, threadId);
      }
      if (path.match(/^\/threads\/[^/]+\/runs$/) && method === "POST") {
        const threadId = path.split("/")[2];
        return this.handleCreateRun(req, res, threadId);
      }
      if (path.match(/^\/threads\/[^/]+\/runs$/) && method === "GET") {
        const threadId = path.split("/")[2];
        return this.handleListRuns(threadId, res);
      }
      if (path.match(/^\/threads\/[^/]+\/runs\/[^/]+$/) && method === "GET") {
        const parts = path.split("/");
        const runId = parts[4];
        return this.handleGetRun(runId, res);
      }

      // 404 for unmatched routes
      sendError(res, "Not found", 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sendError(res, message, 500);
    }
  }

  // ===========================================================================
  // Handler Implementations
  // ===========================================================================

  private handleInfo(res: ServerResponse): void {
    const info: ServerInfo = {
      version: "1.0.0",
      langgraph_api_version: "0.1.0",
    };
    sendJson(res, info);
  }

  private async handleAssistantsSearch(
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    // Return the single assistant created from the agent card
    const assistants = Array.from(this.store.assistants.values());
    sendJson(res, assistants);
  }

  private handleGetAssistant(id: string, res: ServerResponse): void {
    const assistant = this.store.assistants.get(id);
    if (!assistant) {
      sendError(res, "Assistant not found", 404);
      return;
    }
    sendJson(res, assistant);
  }

  private async handleCreateThread(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const body = await readBody(req);
    const payload: ThreadCreateRequest = body ? JSON.parse(body) : {};

    const threadId = payload.thread_id || crypto.randomUUID();
    const now = new Date().toISOString();

    if (this.store.threads.has(threadId) && payload.if_exists === "raise") {
      sendError(res, "Thread already exists", 409);
      return;
    }

    const thread: LangGraphThread = {
      thread_id: threadId,
      status: "idle",
      metadata: payload.metadata || {},
      created_at: now,
      updated_at: now,
      values: {},
    };

    this.store.threads.set(threadId, thread);
    this.store.threadStates.set(threadId, {
      values: { messages: [] },
      next: [],
      tasks: [],
    });

    sendJson(res, thread, 201);
  }

  private async handleThreadsSearch(
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const threads = Array.from(this.store.threads.values());
    sendJson(res, threads);
  }

  private handleGetThread(id: string, res: ServerResponse): void {
    const thread = this.store.threads.get(id);
    if (!thread) {
      sendError(res, "Thread not found", 404);
      return;
    }
    sendJson(res, thread);
  }

  private handleDeleteThread(id: string, res: ServerResponse): void {
    if (!this.store.threads.has(id)) {
      sendError(res, "Thread not found", 404);
      return;
    }
    this.store.threads.delete(id);
    this.store.threadStates.delete(id);
    res.writeHead(204);
    res.end();
  }

  private handleGetThreadState(id: string, res: ServerResponse): void {
    const state = this.store.threadStates.get(id);
    if (!state) {
      sendError(res, "Thread not found", 404);
      return;
    }
    sendJson(res, state);
  }

  private async handleCreateRun(
    req: IncomingMessage,
    res: ServerResponse,
    threadId: string,
  ): Promise<void> {
    const body = await readBody(req);
    const payload: RunCreateRequest = JSON.parse(body);

    const runId = crypto.randomUUID();
    const now = new Date().toISOString();

    const run: LangGraphRun = {
      run_id: runId,
      thread_id: threadId,
      assistant_id: payload.assistant_id || this.assistantId,
      status: "pending",
      metadata: payload.metadata || {},
      created_at: now,
      updated_at: now,
    };

    this.store.runs.set(runId, run);

    // Execute the run asynchronously
    this.executeRun(run, payload).catch(console.error);

    sendJson(res, run, 201);
  }

  private handleListRuns(threadId: string, res: ServerResponse): void {
    const runs = Array.from(this.store.runs.values()).filter(
      (r) => r.thread_id === threadId,
    );
    sendJson(res, runs);
  }

  private handleGetRun(runId: string, res: ServerResponse): void {
    const run = this.store.runs.get(runId);
    if (!run) {
      sendError(res, "Run not found", 404);
      return;
    }
    sendJson(res, run);
  }

  private async handleRunWait(
    req: IncomingMessage,
    res: ServerResponse,
    threadId: string | null,
  ): Promise<void> {
    const body = await readBody(req);
    const payload: RunCreateRequest = JSON.parse(body);

    // Create thread if not provided
    const actualThreadId = threadId || this.createTemporaryThread();

    // Execute and wait for completion
    const result = await this.executeRunSync(actualThreadId, payload);
    sendJson(res, result);
  }

  private async handleRunStream(
    req: IncomingMessage,
    res: ServerResponse,
    threadId: string | null,
  ): Promise<void> {
    const body = await readBody(req);
    const payload: RunCreateRequest = JSON.parse(body);

    // Create thread if not provided
    const actualThreadId = threadId || this.createTemporaryThread();

    // Set up SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const runId = crypto.randomUUID();

    // Send metadata event
    writeSSE(res, "metadata", {
      run_id: runId,
      thread_id: actualThreadId,
      assistant_id: payload.assistant_id || this.assistantId,
    });

    try {
      // Convert input to A2A message
      const message = inputToA2AMessage(payload.input || {});
      message.contextId = actualThreadId;

      // Create task context
      const task: Task = {
        id: runId,
        state: "submitted",
        contextId: actualThreadId,
        messages: [message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const context: TaskContext = { task, message };

      // Get thread state for messages history
      const threadState = this.store.threadStates.get(actualThreadId);
      const messages: LangGraphMessage[] =
        (threadState?.values?.messages as LangGraphMessage[]) || [];

      // Add input message to history
      messages.push(a2aToLangGraphMessage(message));

      // Execute handler and stream results
      let lastMessage: Message | undefined;

      for await (const update of this.config.handler(context)) {
        if (update.message) {
          lastMessage = update.message;
          const lgMessage = a2aToLangGraphMessage(update.message);
          messages.push(lgMessage);

          // Stream the message
          writeSSE(res, "messages", [lgMessage]);

          // Stream values update
          writeSSE(res, "values", { messages });
        }

        // Stream updates
        writeSSE(res, "updates", {
          agent: {
            messages: lastMessage ? [a2aToLangGraphMessage(lastMessage)] : [],
          },
        });
      }

      // Update thread state
      if (threadState) {
        threadState.values = { messages };
        this.store.threadStates.set(actualThreadId, threadState);
      }

      // Send end event
      writeSSE(res, "end", null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      writeSSE(res, "error", { message });
    }

    res.end();
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private createTemporaryThread(): string {
    const threadId = crypto.randomUUID();
    const now = new Date().toISOString();

    this.store.threads.set(threadId, {
      thread_id: threadId,
      status: "idle",
      metadata: { temporary: true },
      created_at: now,
      updated_at: now,
    });

    this.store.threadStates.set(threadId, {
      values: { messages: [] },
      next: [],
      tasks: [],
    });

    return threadId;
  }

  private async executeRun(
    run: LangGraphRun,
    payload: RunCreateRequest,
  ): Promise<void> {
    run.status = "running";
    this.store.runs.set(run.run_id, run);

    try {
      await this.executeRunSync(run.thread_id, payload);
      run.status = "success";
    } catch {
      run.status = "error";
    }

    run.updated_at = new Date().toISOString();
    this.store.runs.set(run.run_id, run);
  }

  private async executeRunSync(
    threadId: string,
    payload: RunCreateRequest,
  ): Promise<LangGraphThreadState> {
    const message = inputToA2AMessage(payload.input || {});
    message.contextId = threadId;

    const task: Task = {
      id: crypto.randomUUID(),
      state: "submitted",
      contextId: threadId,
      messages: [message],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const context: TaskContext = { task, message };

    // Get or create thread state
    let threadState = this.store.threadStates.get(threadId);
    if (!threadState) {
      threadState = {
        values: { messages: [] },
        next: [],
        tasks: [],
      };
    }

    const messages = (threadState.values?.messages as LangGraphMessage[]) || [];
    messages.push(a2aToLangGraphMessage(message));

    // Execute handler
    for await (const update of this.config.handler(context)) {
      if (update.message) {
        messages.push(a2aToLangGraphMessage(update.message));
      }
    }

    threadState.values = { messages };
    this.store.threadStates.set(threadId, threadState);

    // Update thread
    const thread = this.store.threads.get(threadId);
    if (thread) {
      thread.updated_at = new Date().toISOString();
      this.store.threads.set(threadId, thread);
    }

    return threadState;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new LangGraph server.
 */
export function createLangGraphServer(
  config: LangGraphServerConfig,
): LangGraphServer {
  return new LangGraphServer(config);
}
