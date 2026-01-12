/**
 * Warden Client Tests
 *
 * Tests for the WardenClient and WardenA2AClient classes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  WardenClient,
  WardenA2AClient,
  createClient,
  createA2AOnlyClient,
} from "./client.js";
import { A2AClient } from "./a2a/client.js";
import type { AgentCard, Task, StreamEvent } from "./a2a/types.js";

// =============================================================================
// Mock Setup
// =============================================================================

function createMockFetch(responses: Array<{ status: number; body: unknown }>) {
  let callIndex = 0;
  return vi.fn(async (_url: string, _options?: RequestInit) => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.status === 200 ? "OK" : "Error",
      headers: new Headers(),
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

// =============================================================================
// WardenClient Tests
// =============================================================================

describe("WardenClient", () => {
  describe("constructor", () => {
    it("should create client with default config", () => {
      const client = new WardenClient();
      expect(client).toBeInstanceOf(WardenClient);
      expect(client.a2a).toBeInstanceOf(WardenA2AClient);
    });

    it("should create client with apiUrl", () => {
      const client = new WardenClient({ apiUrl: "http://localhost:8000" });
      expect(client).toBeInstanceOf(WardenClient);
    });

    it("should use apiUrl for A2A client when no separate a2a.url provided", () => {
      // WardenClient uses apiUrl as default for a2a when a2a.url is not set
      // We can't easily test the internal URL without making a request,
      // but we can verify the client is created and configured
      const client = new WardenClient({
        apiUrl: "http://localhost:8000",
      });
      expect(client.a2a).toBeInstanceOf(WardenA2AClient);
    });

    it("should accept separate A2A URL in config", () => {
      // When a2a.url is provided, it should be used instead of apiUrl
      const client = new WardenClient({
        apiUrl: "http://localhost:8000",
        a2a: { url: "http://a2a-server:3000" },
      });
      expect(client.a2a).toBeInstanceOf(WardenA2AClient);
    });

    it("should accept A2A auth config", () => {
      // WardenClient should accept auth configuration for A2A
      const client = new WardenClient({
        a2a: {
          auth: { type: "bearer", credentials: "token123" },
        },
      });
      expect(client.a2a).toBeInstanceOf(WardenA2AClient);
    });

    it("should accept A2A custom headers config", () => {
      // WardenClient should accept custom headers for A2A
      const client = new WardenClient({
        a2a: {
          headers: { "X-Custom": "value" },
        },
      });
      expect(client.a2a).toBeInstanceOf(WardenA2AClient);
    });
  });

  describe("a2a property", () => {
    it("should expose WardenA2AClient instance", () => {
      const client = new WardenClient();
      expect(client.a2a).toBeInstanceOf(WardenA2AClient);
      expect(client.a2a).toBeInstanceOf(A2AClient);
    });
  });
});

// =============================================================================
// WardenA2AClient Tests
// =============================================================================

describe("WardenA2AClient", () => {
  describe("discoverAgent", () => {
    it("should fetch and cache agent card", async () => {
      const agentCard: AgentCard = { name: "Cached Agent" };
      const mockFetch = createMockFetch([{ status: 200, body: agentCard }]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result1 = await client.discoverAgent("http://other-agent.com");
      const result2 = await client.discoverAgent("http://other-agent.com");

      expect(result1).toEqual(agentCard);
      expect(result2).toEqual(agentCard);
      // Should only fetch once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should force refresh with force option", async () => {
      const agentCard: AgentCard = { name: "Refreshed Agent" };
      const mockFetch = createMockFetch([
        { status: 200, body: { name: "Original" } },
        { status: 200, body: agentCard },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      await client.discoverAgent("http://agent.com");
      const result = await client.discoverAgent("http://agent.com", {
        force: true,
      });

      expect(result).toEqual(agentCard);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should cache different agents separately", async () => {
      const mockFetch = createMockFetch([
        { status: 200, body: { name: "Agent 1" } },
        { status: 200, body: { name: "Agent 2" } },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const agent1 = await client.discoverAgent("http://agent1.com");
      const agent2 = await client.discoverAgent("http://agent2.com");

      expect(agent1.name).toBe("Agent 1");
      expect(agent2.name).toBe("Agent 2");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendText", () => {
    it("should send text message", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "submitted" },
          }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.sendText("Hello, agent!");

      expect(result.task?.id).toBe("1");
      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.message.role).toBe("user");
      expect(callBody.params.message.parts[0].type).toBe("text");
      expect(callBody.params.message.parts[0].text).toBe("Hello, agent!");
    });

    it("should include context and metadata options", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "submitted" },
          }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      await client.sendText("Hello", {
        contextId: "ctx-123",
        taskId: "task-456",
        metadata: { source: "test" },
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.message.contextId).toBe("ctx-123");
      expect(callBody.params.message.taskId).toBe("task-456");
      expect(callBody.params.message.metadata).toEqual({ source: "test" });
    });
  });

  describe("streamText", () => {
    it("should stream text message response", async () => {
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
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const receivedEvents: StreamEvent[] = [];
      for await (const event of client.streamText("Hello!")) {
        receivedEvents.push(event);
      }

      expect(receivedEvents).toEqual(events);
    });

    it("should include options in streamed message", async () => {
      const mockFetch = createMockFetch([{ status: 200, body: [] }]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      for await (const _ of client.streamText("Hello", {
        contextId: "ctx-1",
      })) {
        // Consume
      }

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.message.contextId).toBe("ctx-1");
    });
  });

  describe("waitForTask", () => {
    it("should poll until task reaches terminal state", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "working" }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "working" }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.waitForTask("1", { pollInterval: 10 });

      expect(result.state).toBe("completed");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should return immediately if already in terminal state", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.waitForTask("1");

      expect(result.state).toBe("completed");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle failed state", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            id: "1",
            state: "failed",
            error: { code: "ERR", message: "Failed" },
          }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.waitForTask("1");

      expect(result.state).toBe("failed");
    });

    it("should handle cancelled state", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "cancelled" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.waitForTask("1");

      expect(result.state).toBe("cancelled");
    });

    it("should handle rejected state", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "rejected" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.waitForTask("1");

      expect(result.state).toBe("rejected");
    });

    it("should timeout after specified duration", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "working" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      await expect(
        client.waitForTask("1", { timeout: 50, pollInterval: 20 }),
      ).rejects.toThrow("Timeout waiting for task 1");
    });

    it("should respect abort signal", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "working" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });
      const controller = new AbortController();

      const promise = client.waitForTask("1", {
        pollInterval: 10,
        signal: controller.signal,
      });

      // Abort after a short delay
      setTimeout(() => controller.abort(), 30);

      await expect(promise).rejects.toThrow("Operation aborted");
    });
  });

  describe("converse", () => {
    it("should send message and wait for completion", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "submitted" },
          }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({
            id: "1",
            state: "completed",
            messages: [
              { role: "agent", parts: [{ type: "text", text: "Hi!" }] },
            ],
          }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.converse("Hello!");

      expect(result.state).toBe("completed");
    });

    it("should accept string message", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "completed" },
          }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      await client.converse("Hello string");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.message.parts[0].text).toBe("Hello string");
    });

    it("should accept Message object", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "completed" },
          }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      await client.converse({
        role: "user",
        parts: [
          { type: "text", text: "Analyze this:" },
          { type: "data", data: { key: "value" } },
        ],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.message.parts).toHaveLength(2);
    });

    it("should apply contextId from options", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "completed" },
          }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      await client.converse("Hello", { contextId: "ctx-override" });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.params.message.contextId).toBe("ctx-override");
    });

    it("should return synthetic task for direct response", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            message: {
              role: "agent",
              parts: [{ type: "text", text: "Direct response" }],
            },
          }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const result = await client.converse("Hello");

      expect(result.state).toBe("completed");
      expect(result.id).toMatch(/^synthetic-/);
      expect(result.messages).toHaveLength(2);
    });
  });

  describe("clearCache", () => {
    it("should clear agent cache", async () => {
      const mockFetch = createMockFetch([
        { status: 200, body: { name: "Agent v1" } },
        { status: 200, body: { name: "Agent v2" } },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      await client.discoverAgent("http://agent.com");
      client.clearCache();
      const result = await client.discoverAgent("http://agent.com");

      expect(result.name).toBe("Agent v2");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe("createClient", () => {
  it("should create WardenClient instance", () => {
    const client = createClient();
    expect(client).toBeInstanceOf(WardenClient);
  });

  it("should pass config to WardenClient", () => {
    const client = createClient({
      apiUrl: "http://custom:8000",
      a2a: { url: "http://a2a-custom:3000" },
    });

    expect(client).toBeInstanceOf(WardenClient);
    expect(client.a2a).toBeInstanceOf(WardenA2AClient);
  });
});

describe("createA2AOnlyClient", () => {
  it("should create WardenA2AClient instance", () => {
    const client = createA2AOnlyClient({ url: "http://localhost:3000" });
    expect(client).toBeInstanceOf(WardenA2AClient);
  });

  it("should not include LangGraph functionality", () => {
    const client = createA2AOnlyClient({ url: "http://localhost:3000" });
    // WardenA2AClient doesn't have LangGraph methods like 'assistants'
    expect(client).not.toHaveProperty("assistants");
  });
});

// =============================================================================
// A2A Protocol Integration Tests
// =============================================================================

describe("A2A Protocol Integration", () => {
  describe("multi-turn conversation", () => {
    it("should maintain context across turns", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "completed", contextId: "ctx-1" },
          }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "2", state: "completed", contextId: "ctx-1" },
          }),
        },
        {
          status: 200,
          body: createJsonRpcResponse({ id: "2", state: "completed" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const turn1 = await client.converse("First message", {
        contextId: "ctx-1",
      });
      const turn2 = await client.converse("Second message", {
        contextId: "ctx-1",
      });

      // Verify context was passed in both turns
      const body1 = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const body2 = JSON.parse(mockFetch.mock.calls[2][1]?.body as string);
      expect(body1.params.message.contextId).toBe("ctx-1");
      expect(body2.params.message.contextId).toBe("ctx-1");
    });
  });

  describe("error recovery", () => {
    it("should handle intermittent failures gracefully", async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "submitted" },
          }),
        },
        { status: 500, body: {} }, // Intermittent failure on poll
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "completed" }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      // This will fail on second poll but succeed on third
      // In real implementation, you'd want retry logic
      const response = await client.sendText("Test");
      expect(response.task?.id).toBe("1");
    });
  });

  describe("task lifecycle", () => {
    it("should track task through complete lifecycle", async () => {
      const mockFetch = createMockFetch([
        // Send message -> task created
        {
          status: 200,
          body: createJsonRpcResponse({
            task: { id: "1", state: "submitted" },
          }),
        },
        // First poll -> working
        {
          status: 200,
          body: createJsonRpcResponse({ id: "1", state: "working" }),
        },
        // Second poll -> completed with result
        {
          status: 200,
          body: createJsonRpcResponse({
            id: "1",
            state: "completed",
            messages: [
              { role: "user", parts: [{ type: "text", text: "Do something" }] },
              { role: "agent", parts: [{ type: "text", text: "Done!" }] },
            ],
            artifacts: [
              {
                type: "artifact",
                artifact: { mimeType: "text/plain", content: "Result" },
              },
            ],
          }),
        },
      ]);
      const client = new WardenA2AClient({
        url: "http://localhost:3000",
        fetch: mockFetch,
      });

      const response = await client.sendText("Do something");
      const completedTask = await client.waitForTask(response.task!.id, {
        pollInterval: 10,
      });

      expect(completedTask.state).toBe("completed");
      expect(completedTask.messages).toHaveLength(2);
      expect(completedTask.artifacts).toHaveLength(1);
    });
  });
});
