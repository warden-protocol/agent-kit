/**
 * A2A Server Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { A2AServer, createA2AServer, type MessageHandler } from "./server.js";
import type {
  AgentCard,
  Message,
  StreamEvent,
  TaskStatusUpdateEvent,
} from "./types.js";

// =============================================================================
// Test Helpers
// =============================================================================

const TEST_AGENT_CARD: AgentCard = {
  name: "Test Agent",
  url: "http://localhost:0",
  description: "A test agent",
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
};

async function makeRequest(
  port: number,
  method: string,
  params?: unknown,
  headers?: Record<string, string>,
): Promise<Response> {
  return fetch(`http://localhost:${port}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  });
}

async function getAgentCard(port: number): Promise<Response> {
  return fetch(`http://localhost:${port}/.well-known/agent-card.json`);
}

function createMessage(text: string): Message {
  return {
    role: "user",
    parts: [{ type: "text", text }],
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("A2AServer", () => {
  let server: A2AServer;
  let port: number;

  // Simple echo handler
  const echoHandler: MessageHandler = async function* (message) {
    const text = message.parts.find((p) => p.type === "text");
    const inputText = text?.type === "text" ? text.text : "";

    yield {
      type: "task_status_update",
      taskId: "",
      state: "working",
      timestamp: new Date().toISOString(),
    };

    yield {
      type: "task_status_update",
      taskId: "",
      state: "completed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `Echo: ${inputText}` }],
      },
      timestamp: new Date().toISOString(),
    };
  };

  beforeEach(async () => {
    // Use port 0 to get a random available port
    server = createA2AServer({
      agentCard: TEST_AGENT_CARD,
      handleMessage: echoHandler,
    });

    // Listen on random port
    await server.listen(0);
    // Get the actual port
    const address = (server as any).server?.address();
    port = typeof address === "object" ? address.port : 0;
  });

  afterEach(async () => {
    await server.close();
  });

  describe("agent card discovery", () => {
    it("should serve agent card at /.well-known/agent-card.json", async () => {
      const response = await getAgentCard(port);
      expect(response.ok).toBe(true);

      const card = await response.json();
      expect(card.name).toBe("Test Agent");
      expect(card.description).toBe("A test agent");
    });

    it("should include CORS headers", async () => {
      const response = await getAgentCard(port);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("a2a.GetExtendedAgentCard", () => {
    it("should return agent card via JSON-RPC", async () => {
      const response = await makeRequest(port, "a2a.GetExtendedAgentCard");
      const json = await response.json();

      expect(json.jsonrpc).toBe("2.0");
      expect(json.result.name).toBe("Test Agent");
      expect(json.id).toBe(1);
    });
  });

  describe("a2a.SendMessage", () => {
    it("should create task and process message", async () => {
      const response = await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("Hello"),
      });
      const json = await response.json();

      // Result is the task in A2A format (not wrapped in {task: ...})
      expect(json.result.id).toBe("task-1");
      expect(json.result.status.state).toBe("completed");
      expect(json.result.history).toHaveLength(2);

      const agentMessage = json.result.history[1];
      expect(agentMessage.role).toBe("agent");
      expect(agentMessage.parts[0].kind).toBe("text");
      expect(agentMessage.parts[0].text).toBe("Echo: Hello");
    });

    it("should increment task IDs", async () => {
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("First"),
      });
      const response = await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("Second"),
      });
      const json = await response.json();

      expect(json.result.id).toBe("task-2");
    });

    it("should handle promise-based handlers", async () => {
      // Create server with promise handler
      const promiseServer = createA2AServer({
        agentCard: TEST_AGENT_CARD,
        handleMessage: async (message) => {
          const text = message.parts.find((p) => p.type === "text");
          const inputText = text?.type === "text" ? text.text : "";
          return {
            role: "agent",
            parts: [{ type: "text", text: `Processed: ${inputText}` }],
          };
        },
      });

      await promiseServer.listen(0);
      const promisePort = (promiseServer as any).server?.address().port;

      try {
        const response = await makeRequest(promisePort, "a2a.SendMessage", {
          message: createMessage("Test"),
        });
        const json = await response.json();

        expect(json.result.status.state).toBe("completed");
        expect(json.result.history[1].parts[0].text).toBe("Processed: Test");
      } finally {
        await promiseServer.close();
      }
    });
  });

  describe("a2a.SendStreamingMessage", () => {
    it("should stream events via SSE", async () => {
      const response = await fetch(`http://localhost:${port}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "a2a.SendStreamingMessage",
          params: { message: createMessage("Stream me") },
          id: 1,
        }),
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get("content-type")).toBe("text/event-stream");

      const text = await response.text();
      const events = text
        .split("\n\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.replace("data: ", ""))
        .filter((data) => data && data !== "[DONE]")
        .map((data) => JSON.parse(data));

      expect(events.length).toBeGreaterThanOrEqual(2);

      // Events are wrapped in JSON-RPC format: { jsonrpc, id, result: { status: { state } } }
      const states = events.map(
        (e: { result?: { status?: { state?: string } } }) =>
          e.result?.status?.state,
      );
      expect(states).toContain("submitted");
      expect(states).toContain("working");
      expect(states).toContain("completed");
    });
  });

  describe("a2a.GetTask", () => {
    it("should return task by ID", async () => {
      // Create a task first
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("Hello"),
      });

      // Get the task
      const response = await makeRequest(port, "a2a.GetTask", {
        name: "tasks/task-1",
      });
      const json = await response.json();

      expect(json.result.id).toBe("task-1");
      // Result uses A2A format with status.state
      expect(json.result.status.state).toBe("completed");
    });

    it("should return error for non-existent task", async () => {
      const response = await makeRequest(port, "a2a.GetTask", {
        name: "tasks/non-existent",
      });
      const json = await response.json();

      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32001); // TASK_NOT_FOUND
    });
  });

  describe("a2a.ListTasks", () => {
    it("should list all tasks", async () => {
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("First"),
      });
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("Second"),
      });

      const response = await makeRequest(port, "a2a.ListTasks", {});
      const json = await response.json();

      expect(json.result.tasks).toHaveLength(2);
    });

    it("should filter by status", async () => {
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("Test"),
      });

      const response = await makeRequest(port, "a2a.ListTasks", {
        status: "completed",
      });
      const json = await response.json();

      expect(
        json.result.tasks.every((t: any) => t.status.state === "completed"),
      ).toBe(true);
    });

    it("should respect pageSize", async () => {
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("1"),
      });
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("2"),
      });
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("3"),
      });

      const response = await makeRequest(port, "a2a.ListTasks", {
        pageSize: 2,
      });
      const json = await response.json();

      expect(json.result.tasks).toHaveLength(2);
    });
  });

  describe("a2a.CancelTask", () => {
    it("should cancel a task in working state", async () => {
      // Create a handler that stays in working state until cancelled
      let resolveHandler: (() => void) | undefined;
      const slowServer = createA2AServer({
        agentCard: TEST_AGENT_CARD,
        handleMessage: () => {
          return (async function* () {
            yield {
              type: "task_status_update" as const,
              taskId: "",
              state: "working" as const,
              timestamp: new Date().toISOString(),
            };
            // Block until cancelled
            await new Promise<void>((resolve) => {
              resolveHandler = resolve;
            });
          })();
        },
      });

      await slowServer.listen(0);
      const slowPort = (slowServer as any).server?.address().port;

      try {
        // Send a streaming message (non-blocking) so the task enters working state
        const streamPromise = makeRequest(
          slowPort,
          "a2a.SendStreamingMessage",
          { message: createMessage("Test") },
        );

        // Wait a tick for the handler to yield the working state
        await new Promise((r) => setTimeout(r, 50));

        // Cancel the task while it's working
        const response = await makeRequest(slowPort, "a2a.CancelTask", {
          name: "tasks/task-1",
        });
        const json = await response.json();

        expect(json.result.status.state).toBe("cancelled");

        // Unblock the handler so the stream request can finish
        resolveHandler?.();
        await streamPromise;
      } finally {
        await slowServer.close();
      }
    });

    it("should return error when cancelling a completed task", async () => {
      // Create task that completes immediately
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("Test"),
      });

      // Try to cancel the completed task
      const response = await makeRequest(port, "a2a.CancelTask", {
        name: "tasks/task-1",
      });
      const json = await response.json();

      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32602); // INVALID_PARAMS
      expect(json.error.message).toContain("Cannot cancel task in state");
    });

    it("should return error for non-existent task", async () => {
      const response = await makeRequest(port, "a2a.CancelTask", {
        name: "tasks/non-existent",
      });
      const json = await response.json();

      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32001);
    });
  });

  describe("a2a.SubscribeToTask", () => {
    it("should return current state for completed task", async () => {
      // Create a completed task
      await makeRequest(port, "a2a.SendMessage", {
        message: createMessage("Test"),
      });

      // Subscribe to it
      const response = await fetch(`http://localhost:${port}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "a2a.SubscribeToTask",
          params: { name: "tasks/task-1" },
          id: 1,
        }),
      });

      expect(response.ok).toBe(true);

      const text = await response.text();
      const events = text
        .split("\n\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.replace("data: ", ""))
        .filter((data) => data && data !== "[DONE]")
        .map((data) => JSON.parse(data));

      // Should have at least the current state event (wrapped in JSON-RPC format)
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].result.status.state).toBe("completed");
    });

    it("should return error for non-existent task", async () => {
      const response = await makeRequest(port, "a2a.SubscribeToTask", {
        name: "tasks/non-existent",
      });
      const json = await response.json();

      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32001);
    });
  });

  describe("error handling", () => {
    it("should return METHOD_NOT_FOUND for unknown methods", async () => {
      const response = await makeRequest(port, "a2a.UnknownMethod", {});
      const json = await response.json();

      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32601);
      expect(json.error.message).toContain("Method not found");
    });

    it("should return PARSE_ERROR for invalid JSON", async () => {
      const response = await fetch(`http://localhost:${port}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });
      const json = await response.json();

      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32700);
    });

    it("should return 404 for unknown paths", async () => {
      const response = await fetch(`http://localhost:${port}/unknown`);
      expect(response.status).toBe(404);
    });
  });

  describe("CORS", () => {
    it("should handle OPTIONS preflight requests", async () => {
      const response = await fetch(`http://localhost:${port}`, {
        method: "OPTIONS",
      });
      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-methods")).toContain(
        "POST",
      );
    });

    it("should allow disabling CORS", async () => {
      const noCorsServer = createA2AServer({
        agentCard: TEST_AGENT_CARD,
        handleMessage: echoHandler,
        cors: false,
      });

      await noCorsServer.listen(0);
      const noCorsPort = (noCorsServer as any).server?.address().port;

      try {
        const response = await getAgentCard(noCorsPort);
        expect(response.headers.get("access-control-allow-origin")).toBeNull();
      } finally {
        await noCorsServer.close();
      }
    });
  });
});

describe("createA2AServer", () => {
  it("should create A2AServer instance", () => {
    const server = createA2AServer({
      agentCard: TEST_AGENT_CARD,
      handleMessage: async () => ({ role: "agent", parts: [] }),
    });

    expect(server).toBeInstanceOf(A2AServer);
  });
});

describe("getHandler", () => {
  it("should return a request handler function", () => {
    const server = createA2AServer({
      agentCard: TEST_AGENT_CARD,
      handleMessage: async () => ({ role: "agent", parts: [] }),
    });

    const handler = server.getHandler();
    expect(typeof handler).toBe("function");
  });
});

describe("agent card management", () => {
  it("should get the current agent card", () => {
    const server = createA2AServer({
      agentCard: TEST_AGENT_CARD,
      handleMessage: async () => ({ role: "agent", parts: [] }),
    });

    const card = server.getAgentCard();
    expect(card.name).toBe("Test Agent");
    expect(card.url).toBe("http://localhost:0");
  });

  it("should update agent card with partial update", () => {
    const server = createA2AServer({
      agentCard: TEST_AGENT_CARD,
      handleMessage: async () => ({ role: "agent", parts: [] }),
    });

    const updated = server.updateAgentCard({ description: "New description" });

    expect(updated.description).toBe("New description");
    expect(updated.name).toBe("Test Agent"); // unchanged
    expect(server.getAgentCard().description).toBe("New description");
  });

  it("should update agent card with function", () => {
    const server = createA2AServer({
      agentCard: TEST_AGENT_CARD,
      handleMessage: async () => ({ role: "agent", parts: [] }),
    });

    const updated = server.updateAgentCard((card) => ({
      ...card,
      skills: [
        ...(card.skills || []),
        { id: "new-skill", name: "New Skill", tags: [] },
      ],
    }));

    expect(updated.skills).toHaveLength(1);
    expect(updated.skills![0].id).toBe("new-skill");
  });

  it("should reflect updates in agent card endpoint", async () => {
    const server = createA2AServer({
      agentCard: TEST_AGENT_CARD,
      handleMessage: async () => ({ role: "agent", parts: [] }),
    });

    await server.listen(0);
    const serverPort = (server as any).server?.address().port;

    try {
      // Update the card
      server.updateAgentCard({ description: "Updated via API" });

      // Fetch and verify
      const response = await fetch(
        `http://localhost:${serverPort}/.well-known/agent-card.json`,
      );
      const card = await response.json();

      expect(card.description).toBe("Updated via API");
    } finally {
      await server.close();
    }
  });
});
