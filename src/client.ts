/**
 * Warden SDK Client
 *
 * A wrapper around @langchain/langgraph-sdk that adds A2A (Agent-to-Agent) protocol support.
 * This client provides a unified interface for both LangGraph operations and A2A communication.
 */

import { Client as LangGraphClient, type ClientConfig as LangGraphClientConfig } from "@langchain/langgraph-sdk";
import { A2AClient, type A2AClientConfig } from "./a2a/client.js";
import type { AgentCard, Message, Task, SendMessageResponse, StreamEvent } from "./a2a/types.js";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the Warden SDK client.
 */
export interface WardenClientConfig extends LangGraphClientConfig {
  /**
   * A2A protocol configuration.
   * If provided, enables A2A functionality.
   */
  a2a?: Omit<A2AClientConfig, "url"> & {
    /**
     * A2A endpoint URL. If not provided, defaults to the main API URL.
     */
    url?: string;
    /**
     * Whether to enable A2A by default.
     * @default true if a2a config is provided
     */
    enabled?: boolean;
  };
}

/**
 * Options for A2A agent communication.
 */
export interface A2AAgentOptions {
  /** Agent URL or discovered agent card */
  agent: string | AgentCard;
  /** Authentication for this specific agent */
  auth?: A2AClientConfig["auth"];
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout */
  timeout?: number;
}

// ============================================================================
// Warden Client
// ============================================================================

/**
 * Warden SDK Client - combines LangGraph SDK with A2A protocol support.
 *
 * @example
 * ```typescript
 * import { WardenClient } from "@warden/sdk";
 *
 * // Create a client with both LangGraph and A2A support
 * const client = new WardenClient({
 *   apiUrl: "http://localhost:8123",
 *   a2a: {
 *     auth: { type: "bearer", credentials: "your-token" }
 *   }
 * });
 *
 * // Use LangGraph features
 * const assistants = await client.assistants.search();
 *
 * // Use A2A features
 * const agentCard = await client.a2a.discoverAgent("http://other-agent.example.com");
 * ```
 */
export class WardenClient extends LangGraphClient {
  /**
   * A2A protocol client for inter-agent communication.
   */
  public readonly a2a: WardenA2AClient;

  /**
   * Create a new Warden client.
   *
   * @param config - Client configuration
   */
  constructor(config?: WardenClientConfig) {
    super(config);

    // Initialize A2A client
    const a2aUrl = config?.a2a?.url ?? config?.apiUrl ?? "http://localhost:8123";
    this.a2a = new WardenA2AClient({
      url: a2aUrl,
      version: config?.a2a?.version,
      auth: config?.a2a?.auth,
      headers: config?.a2a?.headers,
      timeout: config?.a2a?.timeout,
    });
  }
}

// ============================================================================
// Warden A2A Client
// ============================================================================

/**
 * Extended A2A client with additional convenience methods for Warden SDK.
 */
export class WardenA2AClient extends A2AClient {
  private agentCache: Map<string, AgentCard> = new Map();

  /**
   * Discover and cache an agent's capabilities.
   *
   * @param url - Base URL of the agent
   * @param options - Additional options
   * @returns The agent card
   */
  async discoverAgent(
    url: string,
    options?: { force?: boolean }
  ): Promise<AgentCard> {
    if (!options?.force && this.agentCache.has(url)) {
      return this.agentCache.get(url)!;
    }

    const card = await this.getAgentCard(url);
    this.agentCache.set(url, card);
    return card;
  }

  /**
   * Send a text message to an agent.
   *
   * @param text - The text message
   * @param options - Optional context and metadata
   * @returns The response
   */
  async sendText(
    text: string,
    options?: {
      contextId?: string;
      taskId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      message: {
        role: "user",
        parts: [{ type: "text", text }],
        contextId: options?.contextId,
        taskId: options?.taskId,
        metadata: options?.metadata,
      },
    });
  }

  /**
   * Send a text message and stream the response.
   *
   * @param text - The text message
   * @param options - Optional context and metadata
   * @returns An async iterator of stream events
   */
  async *streamText(
    text: string,
    options?: {
      contextId?: string;
      taskId?: string;
      metadata?: Record<string, unknown>;
    }
  ): AsyncGenerator<StreamEvent> {
    yield* this.sendStreamingMessage({
      message: {
        role: "user",
        parts: [{ type: "text", text }],
        contextId: options?.contextId,
        taskId: options?.taskId,
        metadata: options?.metadata,
      },
    });
  }

  /**
   * Wait for a task to reach a terminal state.
   *
   * @param taskId - The task ID
   * @param options - Polling options
   * @returns The completed task
   */
  async waitForTask(
    taskId: string,
    options?: {
      /** Polling interval in milliseconds @default 1000 */
      pollInterval?: number;
      /** Maximum wait time in milliseconds @default 300000 (5 minutes) */
      timeout?: number;
      /** Abort signal */
      signal?: AbortSignal;
    }
  ): Promise<Task> {
    const pollInterval = options?.pollInterval ?? 1000;
    const timeout = options?.timeout ?? 300000;
    const startTime = Date.now();

    const terminalStates = new Set([
      "completed",
      "failed",
      "cancelled",
      "rejected",
    ]);

    while (true) {
      if (options?.signal?.aborted) {
        throw new Error("Operation aborted");
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for task ${taskId}`);
      }

      const task = await this.getTask({ taskId });

      if (terminalStates.has(task.state)) {
        return task;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Execute a conversation turn and wait for completion.
   *
   * @param message - The message to send
   * @param options - Additional options
   * @returns The completed task
   */
  async converse(
    message: Message | string,
    options?: {
      contextId?: string;
      timeout?: number;
    }
  ): Promise<Task> {
    const msg: Message =
      typeof message === "string"
        ? {
            role: "user",
            parts: [{ type: "text", text: message }],
            contextId: options?.contextId,
          }
        : { ...message, contextId: options?.contextId ?? message.contextId };

    const response = await this.sendMessage({ message: msg });

    if (response.task) {
      return this.waitForTask(response.task.id, {
        timeout: options?.timeout,
      });
    }

    // If no task was created, create a synthetic completed task from the response
    return {
      id: `synthetic-${Date.now()}`,
      state: "completed",
      contextId: msg.contextId,
      messages: response.message ? [msg, response.message] : [msg],
    };
  }

  /**
   * Clear the agent cache.
   */
  clearCache(): void {
    this.agentCache.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new Warden client.
 *
 * @param config - Client configuration
 * @returns A configured Warden client
 */
export function createClient(config?: WardenClientConfig): WardenClient {
  return new WardenClient(config);
}

/**
 * Create an A2A-only client for inter-agent communication.
 *
 * @param config - A2A client configuration
 * @returns An A2A client
 */
export function createA2AOnlyClient(config: A2AClientConfig): WardenA2AClient {
  return new WardenA2AClient(config);
}
