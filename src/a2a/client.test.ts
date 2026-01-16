/**
 * A2A Protocol Client Tests
 *
 * Tests for the A2A client implementation to verify protocol compatibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  A2AClient,
  A2AError,
  TaskNotFoundError,
  AuthenticationRequiredError,
  VersionNotSupportedError,
  createA2AClient,
  discoverAgent,
  type A2AClientConfig,
} from "./client.js";
import {
  A2AErrorCodes,
  type AgentCard,
  type Task,
  type StreamEvent,
} from "./types.js";

// =============================================================================
// Mock Setup
// =============================================================================

function createMockFetch(
  responses: Array<{
    status: number;
    body: unknown;
    headers?: Record<string, string>;
  }>,
) {
  let callIndex = 0;
  return vi.fn(async (_url: string, _options?: RequestInit) => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.status === 200 ? "OK" : "Error",
      headers: new Headers(response.headers),
      json: async () => response.body,
      body: response.body
        ? {
            getReader: () => {
              const encoder = new TextEncoder();
              let sent = false;
              return {
                read: async () => {
                  if (sent) return { done: true, value: undefined };
                  sent = true;
                  const events = Array.isArray(response.body)
                    ? response.body
                        .map((e) => `data: ${JSON.stringify(e)}\n\n`)
                        .join("") + "data: [DONE]\n\n"
                    : `data: ${JSON.stringify(response.body)}\n\ndata: [DONE]\n\n`;
                  return { done: false, value: encoder.encode(events) };
                },
                releaseLock: () => {},
              };
            },
          }
        : null,
    } as Response;
  });
}

function createJsonRpcResponse<T>(result: T, id: string | number = 1) {
  return { jsonrpc: "2.0", result, id };
}

function createJsonRpcError(
  code: number,
  message: string,
  id: string | number = 1,
) {
  return { jsonrpc: "2.0", error: { code, message }, id };
}

// =============================================================================
// Tests
// =============================================================================

describe("A2AClient", () => {
  const baseConfig: A2AClientConfig = {
    url: "http://localhost:3000",
  };

  describe("constructor", () => {
    it("should create client with minimal config", () => {
      const client = new A2AClient({ url: "http://localhost:3000" });
      expect(client).toBeInstanceOf(A2AClient);
    });

    it("should normalize URL by removing trailing slash", () => {
      const mockFetch = createMockFetch([
        { status: 200, body: { name: "Agent" } },
      ]);
      const client = new A2AClient({
        url: "http://localhost:3000/",
        fetch: mockFetch,
      });

      // The trailing slash should be removed internally
      client.getAgentCard();
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/.well-known/agent-card.json",
        expect.any(Object),
      );
    });

    it("should accept custom timeout", () => {
      const client = new A2AClient({
        url: "http://localhost:3000",
        timeout: 60000,
      });
      expect(client).toBeInstanceOf(A2AClient);
    });

    it("should accept custom version", () => {
      const client = new A2AClient({
        url: "http://localhost:3000",
        version: "2.0",
      });
      expect(client).toBeInstanceOf(A2AClient);
    });
  });

  describe("authentication", () => {
    it("should add bearer token header", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new A2AClient({
        ...baseConfig,
        auth: { type: "bearer", credentials: "my-token" },
        fetch: mockFetch,
      });

      await client.getTask({ taskId: "1" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-token",
          }),
        }),
      );
    });

    it("should add basic auth header", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new A2AClient({
        ...baseConfig,
        auth: { type: "basic", credentials: "dXNlcjpwYXNz" },
        fetch: mockFetch,
      });

      await client.getTask({ taskId: "1" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Basic dXNlcjpwYXNz",
          }),
        }),
      );
    });

    it("should add API key header with default name", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new A2AClient({
        ...baseConfig,
        auth: { type: "apiKey", credentials: "my-api-key" },
        fetch: mockFetch,
      });

      await client.getTask({ taskId: "1" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": "my-api-key",
          }),
        }),
      );
    });

    it("should add API key header with custom name", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new A2AClient({
        ...baseConfig,
        auth: {
          type: "apiKey",
          credentials: "my-api-key",
          headerName: "X-Custom-Key",
        },
        fetch: mockFetch,
      });

      await client.getTask({ taskId: "1" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Custom-Key": "my-api-key",
          }),
        }),
      );
    });

    it("should include A2A-Version header", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new A2AClient({
        ...baseConfig,
        version: "1.0",
        fetch: mockFetch,
      });

      await client.getTask({ taskId: "1" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "A2A-Version": "1.0",
          }),
        }),
      );
    });

    it("should include custom headers", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new A2AClient({
        ...baseConfig,
        headers: { "X-Request-ID": "req-123", "X-Trace-ID": "trace-456" },
        fetch: mockFetch,
      });

      await client.getTask({ taskId: "1" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Request-ID": "req-123",
            "X-Trace-ID": "trace-456",
          }),
        }),
      );
    });
  });

  describe("getAgentCard", () => {
    it("should fetch agent card from well-known location", async () => {
      const agentCard: AgentCard = {
        name: "Test Agent",
        description: "A test agent",
        version: "1.0.0",
        capabilities: { streaming: true },
      };
      const mockFetch = createMockFetch([{ status: 200, body: agentCard }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.getAgentCard();

      expect(result).toEqual(agentCard);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/.well-known/agent-card.json",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should fetch agent card from custom URL", async () => {
      const agentCard: AgentCard = { name: "Other Agent" };
      const mockFetch = createMockFetch([{ status: 200, body: agentCard }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.getAgentCard("http://other-agent.com");

      expect(result).toEqual(agentCard);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://other-agent.com/.well-known/agent-card.json",
        expect.any(Object),
      );
    });

    it("should throw A2AError on HTTP error", async () => {
      const mockFetch = createMockFetch([{ status: 404, body: {} }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.getAgentCard()).rejects.toThrow(A2AError);
    });
  });

  describe("getExtendedAgentCard", () => {
    it("should call a2a.GetExtendedAgentCard RPC method", async () => {
      const extendedCard: AgentCard = {
        name: "Extended Agent",
        skills: [{ id: "skill-1", name: "Skill" }],
      };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(extendedCard) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.getExtendedAgentCard();

      expect(result).toEqual(extendedCard);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("a2a.GetExtendedAgentCard"),
        }),
      );
    });
  });

  describe("sendMessage", () => {
    it("should send message and return task", async () => {
      // Mock returns A2A wire format (status.state instead of state)
      const wireTask = { id: "task-1", status: { state: "submitted" } };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(wireTask) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.sendMessage({
        message: { role: "user", parts: [{ type: "text", text: "Hello" }] },
      });

      // Client normalizes to internal format
      expect(result.task).toEqual({ id: "task-1", state: "submitted" });
    });

    it("should send message with config options", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "submitted" },
          }),
        },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await client.sendMessage({
        message: { role: "user", parts: [{ type: "text", text: "Hello" }] },
        config: { timeout: 60000, blocking: true },
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.config).toEqual({
        timeout: 60000,
        blocking: true,
      });
    });

    it("should use a2a.SendMessage RPC method", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "submitted" },
          }),
        },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await client.sendMessage({
        message: { role: "user", parts: [{ type: "text", text: "Hello" }] },
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.method).toBe("a2a.SendMessage");
      expect(callBody.jsonrpc).toBe("2.0");
      expect(callBody.id).toBeDefined();
    });
  });

  describe("sendStreamingMessage", () => {
    it("should stream events from SSE response", async () => {
      const events: StreamEvent[] = [
        {
          type: "task_status_update",
          taskId: "1",
          state: "working",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          type: "task_status_update",
          taskId: "1",
          state: "completed",
          timestamp: "2024-01-01T00:00:01Z",
        },
      ];
      const mockFetch = createMockFetch([{ status: 200, body: events }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const receivedEvents: StreamEvent[] = [];
      for await (const event of client.sendStreamingMessage({
        message: { role: "user", parts: [{ type: "text", text: "Hello" }] },
      })) {
        receivedEvents.push(event);
      }

      expect(receivedEvents).toEqual(events);
    });

    it("should include Accept header for SSE", async () => {
      const mockFetch = createMockFetch([{ status: 200, body: [] }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      // Consume the generator
      for await (const _ of client.sendStreamingMessage({
        message: { role: "user", parts: [] },
      })) {
        // Just consume
      }

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "text/event-stream",
          }),
        }),
      );
    });
  });

  describe("getTask", () => {
    it("should get task by ID", async () => {
      // Mock returns A2A wire format
      const wireTask = { id: "task-123", status: { state: "completed" } };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(wireTask) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.getTask({ taskId: "task-123" });

      // Client normalizes to internal format
      expect(result).toEqual({ id: "task-123", state: "completed" });
    });

    it("should use tasks/ resource name format", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "task-123", state: "completed" }),
        },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await client.getTask({ taskId: "task-123" });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.name).toBe("tasks/task-123");
    });
  });

  describe("listTasks", () => {
    it("should list tasks without params", async () => {
      const response = { tasks: [{ id: "1", state: "completed" }] };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(response) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.listTasks();

      expect(result.tasks).toHaveLength(1);
    });

    it("should list tasks with filtering params", async () => {
      const response = { tasks: [], nextPageToken: "token" };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(response) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await client.listTasks({
        contextId: "ctx-1",
        status: "working",
        pageSize: 10,
        pageToken: "prev-token",
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params).toEqual({
        contextId: "ctx-1",
        status: "working",
        pageSize: 10,
        pageToken: "prev-token",
      });
    });
  });

  describe("cancelTask", () => {
    it("should cancel task", async () => {
      // Mock returns A2A wire format
      const wireTask = { id: "task-123", status: { state: "cancelled" } };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(wireTask) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.cancelTask({ taskId: "task-123" });

      expect(result.state).toBe("cancelled");
    });

    it("should include cancellation reason", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "cancelled" }),
        },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await client.cancelTask({ taskId: "task-123", reason: "User requested" });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.reason).toBe("User requested");
    });
  });

  describe("subscribeToTask", () => {
    it("should stream task events", async () => {
      const events: StreamEvent[] = [
        {
          type: "task_status_update",
          taskId: "1",
          state: "completed",
          timestamp: "2024-01-01T00:00:00Z",
        },
      ];
      const mockFetch = createMockFetch([{ status: 200, body: events }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const receivedEvents: StreamEvent[] = [];
      for await (const event of client.subscribeToTask({ taskId: "task-1" })) {
        receivedEvents.push(event);
      }

      expect(receivedEvents).toEqual(events);
    });

    it("should support lastEventId for resumption", async () => {
      const mockFetch = createMockFetch([{ status: 200, body: [] }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      for await (const _ of client.subscribeToTask({
        taskId: "task-1",
        lastEventId: "event-99",
      })) {
        // Just consume
      }

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.lastEventId).toBe("event-99");
    });
  });

  describe("push notification operations", () => {
    it("should set push notification config", async () => {
      const config = {
        id: "config-1",
        taskId: "task-1",
        webhookUrl: "https://example.com/hook",
      };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(config) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.setPushNotificationConfig({
        taskId: "task-1",
        webhookUrl: "https://example.com/hook",
      });

      expect(result.id).toBe("config-1");
    });

    it("should get push notification config", async () => {
      const config = {
        id: "config-1",
        taskId: "task-1",
        webhookUrl: "https://example.com/hook",
      };
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(config) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.getPushNotificationConfig("task-1");

      expect(result).toEqual(config);
    });

    it("should delete push notification config", async () => {
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(null) },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await expect(
        client.deletePushNotificationConfig("task-1"),
      ).resolves.not.toThrow();
    });
  });

  describe("error handling", () => {
    it("should throw A2AError on HTTP error", async () => {
      const mockFetch = createMockFetch([{ status: 500, body: {} }]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.getTask({ taskId: "1" })).rejects.toThrow(A2AError);
    });

    it("should throw A2AError from JSON-RPC error response", async () => {
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcError(-32001, "Task not found") },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      try {
        await client.getTask({ taskId: "1" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(A2AError);
        expect((error as A2AError).code).toBe(-32001);
        expect((error as A2AError).message).toBe("Task not found");
      }
    });

    it("should handle TASK_NOT_FOUND error", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcError(A2AErrorCodes.TASK_NOT_FOUND, "Not found"),
        },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.getTask({ taskId: "1" })).rejects.toMatchObject({
        code: A2AErrorCodes.TASK_NOT_FOUND,
      });
    });

    it("should handle AUTHENTICATION_REQUIRED error", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcError(
            A2AErrorCodes.AUTHENTICATION_REQUIRED,
            "Auth required",
          ),
        },
      ]);
      const client = new A2AClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.getTask({ taskId: "1" })).rejects.toMatchObject({
        code: A2AErrorCodes.AUTHENTICATION_REQUIRED,
      });
    });
  });
});

describe("A2AError", () => {
  it("should create error with code and message", () => {
    const error = new A2AError("Test error", A2AErrorCodes.INTERNAL_ERROR);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe(A2AErrorCodes.INTERNAL_ERROR);
    expect(error.name).toBe("A2AError");
  });

  it("should create error with data", () => {
    const error = new A2AError("Test error", A2AErrorCodes.INTERNAL_ERROR, {
      details: "extra",
    });
    expect(error.data).toEqual({ details: "extra" });
  });

  it("should create from JSON-RPC error response", () => {
    const response = {
      jsonrpc: "2.0" as const,
      error: {
        code: -32001,
        message: "Task not found",
        data: { taskId: "123" },
      },
      id: 1,
    };
    const error = A2AError.fromJsonRpcError(response);
    expect(error.code).toBe(-32001);
    expect(error.message).toBe("Task not found");
    expect(error.data).toEqual({ taskId: "123" });
  });
});

describe("TaskNotFoundError", () => {
  it("should create with task ID", () => {
    const error = new TaskNotFoundError("task-123");
    expect(error.message).toBe("Task not found: task-123");
    expect(error.code).toBe(A2AErrorCodes.TASK_NOT_FOUND);
    expect(error.name).toBe("TaskNotFoundError");
  });
});

describe("AuthenticationRequiredError", () => {
  it("should create with default message", () => {
    const error = new AuthenticationRequiredError();
    expect(error.message).toBe("Authentication required");
    expect(error.code).toBe(A2AErrorCodes.AUTHENTICATION_REQUIRED);
    expect(error.name).toBe("AuthenticationRequiredError");
  });

  it("should create with custom message", () => {
    const error = new AuthenticationRequiredError("Token expired");
    expect(error.message).toBe("Token expired");
  });
});

describe("VersionNotSupportedError", () => {
  it("should create with version", () => {
    const error = new VersionNotSupportedError("2.0");
    expect(error.message).toBe("A2A version not supported: 2.0");
    expect(error.code).toBe(A2AErrorCodes.VERSION_NOT_SUPPORTED);
    expect(error.name).toBe("VersionNotSupportedError");
  });
});

describe("createA2AClient", () => {
  it("should create A2AClient instance", () => {
    const client = createA2AClient({ url: "http://localhost:3000" });
    expect(client).toBeInstanceOf(A2AClient);
  });
});

describe("discoverAgent", () => {
  it("should discover agent and return card", async () => {
    const agentCard: AgentCard = { name: "Discovered Agent" };
    const mockFetch = createMockFetch([{ status: 200, body: agentCard }]);

    const result = await discoverAgent("http://localhost:3000", {
      fetch: mockFetch,
    });

    expect(result).toEqual(agentCard);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/.well-known/agent-card.json",
      expect.any(Object),
    );
  });

  it("should accept timeout option", async () => {
    const mockFetch = createMockFetch([
      { status: 200, body: { name: "Agent" } },
    ]);

    await discoverAgent("http://localhost:3000", {
      fetch: mockFetch,
      timeout: 5000,
    });

    // Timeout is applied internally via AbortSignal.timeout
    expect(mockFetch).toHaveBeenCalled();
  });
});

describe("JSON-RPC Protocol Compliance", () => {
  it("should send valid JSON-RPC 2.0 requests", async () => {
    const mockFetch = createMockFetch([
      {
        status: 200,
        body: createJsonRpcResponse({ id: "1", state: "completed" }),
      },
    ]);
    const client = new A2AClient({
      url: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.getTask({ taskId: "1" });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
    expect(callBody.jsonrpc).toBe("2.0");
    expect(callBody.method).toBe("a2a.GetTask");
    expect(callBody.id).toBeDefined();
    expect(typeof callBody.id).toBe("string");
  });

  it("should generate unique request IDs", async () => {
    const mockFetch = createMockFetch([
      {
        status: 200,
        body: createJsonRpcResponse({ id: "1", state: "completed" }),
      },
      {
        status: 200,
        body: createJsonRpcResponse({ id: "2", state: "completed" }),
      },
    ]);
    const client = new A2AClient({
      url: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.getTask({ taskId: "1" });
    await client.getTask({ taskId: "2" });

    const body1 = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
    const body2 = JSON.parse(mockFetch.mock.calls[1][1]?.body as string);
    expect(body1.id).not.toBe(body2.id);
  });

  it("should use correct A2A method names", async () => {
    // Each method needs an appropriate mock response
    const methodsWithMocks: Array<{
      fn: (client: A2AClient) => Promise<unknown>;
      expected: string;
      mockResponse: unknown;
    }> = [
      {
        fn: (c) => c.getExtendedAgentCard(),
        expected: "a2a.GetExtendedAgentCard",
        mockResponse: { name: "Agent" },
      },
      {
        fn: (c) => c.sendMessage({ message: { role: "user", parts: [] } }),
        expected: "a2a.SendMessage",
        mockResponse: { id: "1", status: { state: "submitted" } },
      },
      {
        fn: (c) => c.getTask({ taskId: "1" }),
        expected: "a2a.GetTask",
        mockResponse: { id: "1", status: { state: "completed" } },
      },
      {
        fn: (c) => c.listTasks(),
        expected: "a2a.ListTasks",
        mockResponse: { tasks: [] },
      },
      {
        fn: (c) => c.cancelTask({ taskId: "1" }),
        expected: "a2a.CancelTask",
        mockResponse: { id: "1", status: { state: "cancelled" } },
      },
      {
        fn: (c) =>
          c.setPushNotificationConfig({
            taskId: "1",
            webhookUrl: "http://x",
          }),
        expected: "a2a.SetTaskPushNotificationConfig",
        mockResponse: { id: "config-1", taskId: "1", webhookUrl: "http://x" },
      },
      {
        fn: (c) => c.getPushNotificationConfig("1"),
        expected: "a2a.GetTaskPushNotificationConfig",
        mockResponse: { id: "config-1", taskId: "1", webhookUrl: "http://x" },
      },
      {
        fn: (c) => c.deletePushNotificationConfig("1"),
        expected: "a2a.DeleteTaskPushNotificationConfig",
        mockResponse: null,
      },
    ];

    for (const { fn, expected, mockResponse } of methodsWithMocks) {
      const mockFetch = createMockFetch([
        { status: 200, body: createJsonRpcResponse(mockResponse) },
      ]);
      const client = new A2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });
      await fn(client);
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.method).toBe(expected);
    }
  });
});
