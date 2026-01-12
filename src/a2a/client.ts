/**
 * A2A Protocol Client
 *
 * Implements the Agent2Agent (A2A) Protocol for inter-agent communication.
 * @see https://a2a-protocol.org/latest/specification/
 */

import type {
  AgentCard,
  Task,
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
    return this.rpc<AgentCard>("a2a.GetExtendedAgentCard", {});
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
    return this.rpc<SendMessageResponse>("a2a.SendMessage", params);
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
    yield* this.streamRpc<StreamEvent>("a2a.SendStreamingMessage", params);
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
    return this.rpc<Task>("a2a.GetTask", { name: `tasks/${params.taskId}` });
  }

  /**
   * List tasks with optional filtering.
   *
   * @param params - List parameters
   * @returns List of tasks
   */
  async listTasks(params?: ListTasksParams): Promise<ListTasksResponse> {
    return this.rpc<ListTasksResponse>("a2a.ListTasks", params ?? {});
  }

  /**
   * Cancel a task.
   *
   * @param params - Cancel parameters
   * @returns The cancelled task
   */
  async cancelTask(params: CancelTaskParams): Promise<Task> {
    return this.rpc<Task>("a2a.CancelTask", {
      name: `tasks/${params.taskId}`,
      reason: params.reason,
    });
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
    yield* this.streamRpc<StreamEvent>("a2a.SubscribeToTask", {
      name: `tasks/${params.taskId}`,
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
      "a2a.SetTaskPushNotificationConfig",
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
      "a2a.GetTaskPushNotificationConfig",
      { taskId },
    );
  }

  /**
   * Delete push notification configuration.
   *
   * @param taskId - Task ID
   */
  async deletePushNotificationConfig(taskId: string): Promise<void> {
    await this.rpc<void>("a2a.DeleteTaskPushNotificationConfig", { taskId });
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
                const parsed = JSON.parse(data) as T;
                yield parsed;
              } catch {
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
  options?: { fetch?: typeof fetch; timeout?: number },
): Promise<AgentCard> {
  const config: A2AClientConfig = { url };
  if (options?.fetch) config.fetch = options.fetch;
  if (options?.timeout) config.timeout = options.timeout;

  const client = new A2AClient(config);
  return client.getAgentCard();
}
