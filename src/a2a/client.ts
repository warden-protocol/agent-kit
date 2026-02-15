/**
 * A2A Protocol Client
 *
 * Implements the Agent2Agent (A2A) Protocol for inter-agent communication.
 * @see https://a2a-protocol.org/latest/specification/
 */

import type {
  AgentCard,
  Task,
  TaskState,
  Message,
  SendMessageParams,
  SendMessageResponse,
  GetTaskParams,
  ListTasksParams,
  ListTasksResponse,
  CancelTaskParams,
  SubscribeToTaskParams,
  StreamEvent,
  PushNotificationConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcErrorResponse,
  A2AErrorCode,
} from "./types.js";
import { A2AErrorCodes } from "./types.js";

// ============================================================================
// A2A Wire Format Normalization
// ============================================================================

/**
 * A2A wire format for tasks (as returned by server).
 */
interface A2AWireTask {
  id: string;
  status?: {
    state: TaskState;
    timestamp?: string;
    message?: A2AWireMessage;
  };
  context_id?: string;
  contextId?: string;
  history?: A2AWireMessage[];
  artifacts?: unknown[];
  metadata?: Record<string, unknown>;
  kind?: string;
}

/**
 * A2A wire format for messages.
 */
interface A2AWireMessage {
  role: "user" | "agent";
  parts: Array<{
    kind?: string;
    type?: string;
    text?: string;
    [key: string]: unknown;
  }>;
  message_id?: string;
  kind?: string;
  [key: string]: unknown;
}

/**
 * Normalize a message from A2A wire format to internal format.
 */
function normalizeMessage(wireMsg: A2AWireMessage): Message {
  return {
    role: wireMsg.role,
    parts: wireMsg.parts.map((part) => {
      const { kind, ...rest } = part;
      return { type: kind ?? part.type, ...rest } as Message["parts"][number];
    }),
  };
}

/**
 * Convert a message to A2A wire format for outgoing requests.
 * Converts `type` -> `kind` on parts and adds `messageId` if not present.
 */
function messageToWireFormat(message: Message): Record<string, unknown> {
  const wire: Record<string, unknown> = {
    role: message.role,
    parts: message.parts.map((part) => {
      const p = part as unknown as Record<string, unknown>;
      if ("type" in p && !("kind" in p)) {
        const { type, ...rest } = p;
        return { kind: type, ...rest };
      }
      return p;
    }),
    messageId:
      (message as unknown as Record<string, unknown>).messageId ||
      crypto.randomUUID(),
  };
  if (message.contextId) wire.contextId = message.contextId;
  if (message.taskId) wire.taskId = message.taskId;
  if (message.metadata) wire.metadata = message.metadata;
  return wire;
}

/**
 * Normalize a stream event from A2A wire format to internal StreamEvent format.
 * Handles both our server's format (type: "task_status_update") and the A2A spec
 * wire format (kind: "status-update", kind: "artifact-update", kind: "task").
 */
function normalizeStreamEvent(
  payload: Record<string, unknown>,
): StreamEvent | Record<string, unknown> {
  const kind = payload.kind as string | undefined;
  const type = payload.type as string | undefined;

  // Already in our internal format
  if (type === "task_status_update" || type === "task_artifact_update") {
    return payload as unknown as StreamEvent;
  }

  // A2A wire format: status-update
  if (kind === "status-update") {
    const status = payload.status as Record<string, unknown> | undefined;
    const event: Record<string, unknown> = {
      type: "task_status_update",
      taskId: payload.taskId ?? payload.task_id ?? "",
      state: status?.state ?? "working",
      timestamp: (status?.timestamp as string) ?? new Date().toISOString(),
    };
    if (status?.message) {
      event.message = normalizeMessage(status.message as A2AWireMessage);
    }
    return event as unknown as StreamEvent;
  }

  // A2A wire format: artifact-update
  if (kind === "artifact-update") {
    return {
      type: "task_artifact_update",
      taskId: (payload.taskId ?? payload.task_id ?? "") as string,
      artifact: payload.artifact,
      timestamp: (payload.timestamp as string) ?? new Date().toISOString(),
    } as unknown as StreamEvent;
  }

  // A2A wire format: task (initial task creation event)
  if (kind === "task") {
    const status = payload.status as Record<string, unknown> | undefined;
    return {
      type: "task_status_update",
      taskId: (payload.id ?? "") as string,
      state: (status?.state as string) ?? "submitted",
      timestamp: (status?.timestamp as string) ?? new Date().toISOString(),
    } as unknown as StreamEvent;
  }

  // Unknown format — pass through
  return payload;
}

/**
 * Normalize a task from A2A wire format to internal Task type.
 */
function normalizeTask(wireTask: A2AWireTask): Task {
  const task: Task = {
    id: wireTask.id,
    state: wireTask.status?.state ?? "submitted",
  };

  const contextId = wireTask.contextId ?? wireTask.context_id;
  if (contextId) {
    task.contextId = contextId;
  }

  if (wireTask.history && wireTask.history.length > 0) {
    task.messages = wireTask.history.map(normalizeMessage);
  }

  if (wireTask.status?.timestamp) {
    task.updatedAt = wireTask.status.timestamp;
  }

  if (wireTask.artifacts) {
    task.artifacts = wireTask.artifacts as Task["artifacts"];
  }

  if (wireTask.metadata) {
    task.metadata = wireTask.metadata;
  }

  return task;
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Base error class for A2A protocol errors.
 */
export class A2AError extends Error {
  constructor(
    message: string,
    public readonly code: A2AErrorCode,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "A2AError";
  }

  /** Whether the operation that caused this error can be retried. */
  get retryable(): boolean {
    return (this.data as Record<string, unknown>)?.retryable === true;
  }

  /**
   * Create an A2AError from a JSON-RPC error response.
   */
  static fromJsonRpcError(response: JsonRpcErrorResponse): A2AError {
    return new A2AError(
      response.error.message,
      response.error.code as A2AErrorCode,
      response.error.data,
    );
  }
}

/**
 * Error thrown when a task is not found.
 */
export class TaskNotFoundError extends A2AError {
  constructor(taskId: string) {
    super(`Task not found: ${taskId}`, A2AErrorCodes.TASK_NOT_FOUND);
    this.name = "TaskNotFoundError";
  }
}

/**
 * Error thrown when authentication is required.
 */
export class AuthenticationRequiredError extends A2AError {
  constructor(message = "Authentication required") {
    super(message, A2AErrorCodes.AUTHENTICATION_REQUIRED);
    this.name = "AuthenticationRequiredError";
  }
}

/**
 * Error thrown when the A2A version is not supported.
 */
export class VersionNotSupportedError extends A2AError {
  constructor(version: string) {
    super(
      `A2A version not supported: ${version}`,
      A2AErrorCodes.VERSION_NOT_SUPPORTED,
    );
    this.name = "VersionNotSupportedError";
  }
}

// ============================================================================
// Client Configuration
// ============================================================================

/**
 * Configuration options for the A2A client.
 */
export interface A2AClientConfig {
  /** Base URL of the A2A agent */
  url: string;
  /** A2A protocol version to use */
  version?: string;
  /** Authentication configuration */
  auth?: {
    /** Authentication type */
    type: "bearer" | "apiKey" | "basic";
    /** Credentials (token, API key, or base64 encoded user:pass) */
    credentials: string;
    /** For apiKey type, the header name (default: "X-API-Key") */
    headerName?: string;
  };
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

// ============================================================================
// A2A Client
// ============================================================================

/**
 * Client for interacting with A2A-compatible agents.
 */
export class A2AClient {
  private readonly config: Required<
    Pick<A2AClientConfig, "url" | "version" | "timeout">
  > &
    A2AClientConfig;
  private readonly fetchImpl: typeof fetch;
  private requestIdCounter = 0;

  constructor(config: A2AClientConfig) {
    this.config = {
      version: "1.0",
      timeout: 30000,
      ...config,
      url: config.url.replace(/\/$/, ""), // Remove trailing slash
    };
    this.fetchImpl = config.fetch ?? fetch;
  }

  // ==========================================================================
  // Agent Card Discovery
  // ==========================================================================

  /**
   * Fetch the agent card from the standard well-known location.
   *
   * @param baseUrl - Base URL of the agent (optional, uses client URL if not provided)
   * @returns The agent card
   */
  async getAgentCard(baseUrl?: string): Promise<AgentCard> {
    const url = baseUrl ?? this.config.url;
    const cardUrl = `${url}/.well-known/agent-card.json`;

    const response = await this.fetchImpl(cardUrl, {
      method: "GET",
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new A2AError(
        `Failed to fetch agent card: ${response.status} ${response.statusText}`,
        A2AErrorCodes.INTERNAL_ERROR,
      );
    }

    return response.json() as Promise<AgentCard>;
  }

  /**
   * Fetch the extended agent card (requires authentication).
   *
   * @returns The extended agent card
   */
  async getExtendedAgentCard(): Promise<AgentCard> {
    return this.rpc<AgentCard>("agent/authenticatedExtendedCard", {});
  }

  // ==========================================================================
  // Message Operations
  // ==========================================================================

  /**
   * Send a message to the agent.
   *
   * @param params - Message parameters
   * @returns The task or direct response
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    // Convert message to A2A wire format (type -> kind, add messageId)
    const wireParams = {
      ...params,
      message: messageToWireFormat(params.message),
    };

    // The server may return either a task (wire format) or a direct message response
    const wireResponse = await this.rpc<
      A2AWireTask | { message: A2AWireMessage }
    >("message/send", wireParams);

    // Check if this is a direct message response (no task)
    if ("message" in wireResponse && !("id" in wireResponse)) {
      return { message: normalizeMessage(wireResponse.message) };
    }

    // Otherwise it's a task response in wire format
    return { task: normalizeTask(wireResponse as A2AWireTask) };
  }

  /**
   * Send a message and stream the response.
   *
   * @param params - Message parameters
   * @returns An async iterator of stream events
   */
  async *sendStreamingMessage(
    params: SendMessageParams,
  ): AsyncGenerator<StreamEvent> {
    const wireParams = {
      ...params,
      message: messageToWireFormat(params.message),
    };
    yield* this.streamRpc<StreamEvent>("message/stream", wireParams);
  }

  // ==========================================================================
  // Task Operations
  // ==========================================================================

  /**
   * Get a task by ID.
   *
   * @param params - Task parameters
   * @returns The task
   */
  async getTask(params: GetTaskParams): Promise<Task> {
    const wireTask = await this.rpc<A2AWireTask>("tasks/get", {
      id: params.taskId,
    });
    return normalizeTask(wireTask);
  }

  /**
   * List tasks with optional filtering.
   *
   * @param params - List parameters
   * @returns List of tasks
   */
  async listTasks(params?: ListTasksParams): Promise<ListTasksResponse> {
    const wireResponse = await this.rpc<{
      tasks: A2AWireTask[];
      nextPageToken?: string;
    }>("tasks/list", params ?? {});
    return {
      tasks: wireResponse.tasks.map(normalizeTask),
      nextPageToken: wireResponse.nextPageToken,
    };
  }

  /**
   * Cancel a task.
   *
   * @param params - Cancel parameters
   * @returns The cancelled task
   */
  async cancelTask(params: CancelTaskParams): Promise<Task> {
    const wireTask = await this.rpc<A2AWireTask>("tasks/cancel", {
      id: params.taskId,
      reason: params.reason,
    });
    return normalizeTask(wireTask);
  }

  /**
   * Subscribe to task events.
   *
   * @param params - Subscription parameters
   * @returns An async iterator of stream events
   */
  async *subscribeToTask(
    params: SubscribeToTaskParams,
  ): AsyncGenerator<StreamEvent> {
    yield* this.streamRpc<StreamEvent>("tasks/resubscribe", {
      id: params.taskId,
      lastEventId: params.lastEventId,
    });
  }

  // ==========================================================================
  // Push Notification Operations
  // ==========================================================================

  /**
   * Set push notification configuration for a task.
   *
   * @param config - Push notification configuration
   * @returns The created configuration
   */
  async setPushNotificationConfig(
    config: Omit<PushNotificationConfig, "id">,
  ): Promise<PushNotificationConfig> {
    return this.rpc<PushNotificationConfig>(
      "tasks/pushNotificationConfig/set",
      config,
    );
  }

  /**
   * Get push notification configuration.
   *
   * @param taskId - Task ID
   * @returns The push notification configuration
   */
  async getPushNotificationConfig(
    taskId: string,
  ): Promise<PushNotificationConfig | null> {
    return this.rpc<PushNotificationConfig | null>(
      "tasks/pushNotificationConfig/get",
      { taskId },
    );
  }

  /**
   * Delete push notification configuration.
   *
   * @param taskId - Task ID
   */
  async deletePushNotificationConfig(taskId: string): Promise<void> {
    await this.rpc<void>("tasks/pushNotificationConfig/delete", { taskId });
  }

  // ==========================================================================
  // Internal Methods
  // ==========================================================================

  /**
   * Build request headers including authentication.
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "A2A-Version": this.config.version,
      ...this.config.headers,
    };

    if (this.config.auth) {
      switch (this.config.auth.type) {
        case "bearer":
          headers["Authorization"] = `Bearer ${this.config.auth.credentials}`;
          break;
        case "basic":
          headers["Authorization"] = `Basic ${this.config.auth.credentials}`;
          break;
        case "apiKey":
          headers[this.config.auth.headerName ?? "X-API-Key"] =
            this.config.auth.credentials;
          break;
      }
    }

    return headers;
  }

  /**
   * Generate a unique request ID.
   */
  private generateRequestId(): string {
    return `${Date.now()}-${++this.requestIdCounter}`;
  }

  /**
   * Make a JSON-RPC request.
   */
  private async rpc<T>(method: string, params: unknown): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: this.generateRequestId(),
    };

    const response = await this.fetchImpl(this.config.url, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new A2AError(
        `HTTP error: ${response.status} ${response.statusText}`,
        A2AErrorCodes.INTERNAL_ERROR,
      );
    }

    const jsonResponse = (await response.json()) as JsonRpcResponse<T>;

    if ("error" in jsonResponse) {
      throw A2AError.fromJsonRpcError(jsonResponse);
    }

    return jsonResponse.result;
  }

  /**
   * Make a streaming JSON-RPC request using Server-Sent Events.
   */
  private async *streamRpc<T>(
    method: string,
    params: unknown,
  ): AsyncGenerator<T> {
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: this.generateRequestId(),
    };

    const response = await this.fetchImpl(this.config.url, {
      method: "POST",
      headers: {
        ...this.buildHeaders(),
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new A2AError(
        `HTTP error: ${response.status} ${response.statusText}`,
        A2AErrorCodes.INTERNAL_ERROR,
      );
    }

    if (!response.body) {
      throw new A2AError("Response body is null", A2AErrorCodes.INTERNAL_ERROR);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data && data !== "[DONE]") {
              try {
                const parsed = JSON.parse(data) as Record<string, unknown>;
                // Unwrap JSON-RPC envelope if present
                const payload =
                  parsed.jsonrpc === "2.0" && "result" in parsed
                    ? (parsed.result as Record<string, unknown>)
                    : parsed;

                // Check for JSON-RPC error in stream
                if (parsed.jsonrpc === "2.0" && "error" in parsed) {
                  throw A2AError.fromJsonRpcError(
                    parsed as unknown as JsonRpcErrorResponse,
                  );
                }

                // Normalize A2A wire stream events to internal StreamEvent format
                yield normalizeStreamEvent(payload) as T;
              } catch (e) {
                if (e instanceof A2AError) throw e;
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new A2A client.
 *
 * @param config - Client configuration
 * @returns A configured A2A client
 */
export function createA2AClient(config: A2AClientConfig): A2AClient {
  return new A2AClient(config);
}

/**
 * Discover an agent by fetching its agent card.
 *
 * @param url - Base URL of the agent
 * @param options - Additional options
 * @returns The agent card
 */
export async function discoverAgent(
  url: string,
  options?: {
    fetch?: typeof fetch;
    timeout?: number;
    auth?: A2AClientConfig["auth"];
    headers?: Record<string, string>;
  },
): Promise<AgentCard> {
  const config: A2AClientConfig = { url };
  if (options?.fetch) config.fetch = options.fetch;
  if (options?.timeout) config.timeout = options.timeout;
  if (options?.auth) config.auth = options.auth;
  if (options?.headers) config.headers = options.headers;

  const client = new A2AClient(config);
  return client.getAgentCard();
}
