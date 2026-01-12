/**
 * A2A Protocol Types Tests
 *
 * Tests to verify A2A protocol type definitions and constants
 * are compatible with the A2A specification.
 */

import { describe, it, expect } from "vitest";
import {
  TERMINAL_TASK_STATES,
  A2AErrorCodes,
  type TaskState,
  type Part,
  type TextPart,
  type FilePart,
  type DataPart,
  type ArtifactPart,
  type Message,
  type Task,
  type AgentCard,
  type AgentSkill,
  type AgentCapabilities,
  type SecurityScheme,
  type PushNotificationConfig,
  type StreamEvent,
  type TaskStatusUpdateEvent,
  type TaskArtifactUpdateEvent,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type JsonRpcSuccessResponse,
  type JsonRpcErrorResponse,
  type SendMessageParams,
  type SendMessageResponse,
  type GetTaskParams,
  type ListTasksParams,
  type ListTasksResponse,
  type CancelTaskParams,
  type SubscribeToTaskParams,
} from "./types.js";

describe("A2A Protocol Types", () => {
  describe("Task States", () => {
    it("should define all required task states", () => {
      const requiredStates: TaskState[] = [
        "submitted",
        "working",
        "input_required",
        "completed",
        "failed",
        "cancelled",
        "rejected",
        "auth_required",
      ];

      // Type check - this ensures the TaskState type includes all these values
      requiredStates.forEach((state) => {
        const task: Task = { id: "test", state };
        expect(task.state).toBe(state);
      });
    });

    it("should define correct terminal states", () => {
      expect(TERMINAL_TASK_STATES).toContain("completed");
      expect(TERMINAL_TASK_STATES).toContain("failed");
      expect(TERMINAL_TASK_STATES).toContain("cancelled");
      expect(TERMINAL_TASK_STATES).toContain("rejected");
      expect(TERMINAL_TASK_STATES).toHaveLength(4);
    });

    it("should not include non-terminal states in TERMINAL_TASK_STATES", () => {
      expect(TERMINAL_TASK_STATES).not.toContain("submitted");
      expect(TERMINAL_TASK_STATES).not.toContain("working");
      expect(TERMINAL_TASK_STATES).not.toContain("input_required");
      expect(TERMINAL_TASK_STATES).not.toContain("auth_required");
    });
  });

  describe("Message Parts", () => {
    it("should support TextPart", () => {
      const part: TextPart = {
        type: "text",
        text: "Hello, world!",
        metadata: { language: "en" },
      };
      expect(part.type).toBe("text");
      expect(part.text).toBe("Hello, world!");
    });

    it("should support FilePart with URL", () => {
      const part: FilePart = {
        type: "file",
        file: {
          url: "https://example.com/file.pdf",
          mimeType: "application/pdf",
          name: "document.pdf",
        },
      };
      expect(part.type).toBe("file");
      expect(part.file.url).toBe("https://example.com/file.pdf");
    });

    it("should support FilePart with base64", () => {
      const part: FilePart = {
        type: "file",
        file: {
          base64: "SGVsbG8gV29ybGQ=",
          mimeType: "text/plain",
          name: "hello.txt",
        },
      };
      expect(part.type).toBe("file");
      expect(part.file.base64).toBe("SGVsbG8gV29ybGQ=");
    });

    it("should support DataPart", () => {
      const part: DataPart = {
        type: "data",
        data: {
          key: "value",
          nested: { foo: "bar" },
          array: [1, 2, 3],
        },
      };
      expect(part.type).toBe("data");
      expect(part.data.key).toBe("value");
    });

    it("should support ArtifactPart", () => {
      const part: ArtifactPart = {
        type: "artifact",
        artifact: {
          id: "artifact-1",
          name: "generated-code",
          mimeType: "text/javascript",
          content: "console.log('Hello');",
          description: "Generated JavaScript code",
        },
      };
      expect(part.type).toBe("artifact");
      expect(part.artifact.mimeType).toBe("text/javascript");
    });

    it("should allow Part union type", () => {
      const parts: Part[] = [
        { type: "text", text: "Hello" },
        { type: "file", file: { url: "https://example.com/file.txt" } },
        { type: "data", data: { key: "value" } },
        {
          type: "artifact",
          artifact: { mimeType: "text/plain", content: "test" },
        },
      ];
      expect(parts).toHaveLength(4);
    });
  });

  describe("Messages", () => {
    it("should support user messages", () => {
      const message: Message = {
        role: "user",
        parts: [{ type: "text", text: "Hello, agent!" }],
        contextId: "ctx-123",
        metadata: { source: "cli" },
      };
      expect(message.role).toBe("user");
      expect(message.parts).toHaveLength(1);
    });

    it("should support agent messages", () => {
      const message: Message = {
        role: "agent",
        parts: [
          { type: "text", text: "Hello, user!" },
          {
            type: "artifact",
            artifact: { mimeType: "text/plain", content: "result" },
          },
        ],
        taskId: "task-456",
      };
      expect(message.role).toBe("agent");
      expect(message.parts).toHaveLength(2);
    });

    it("should support multi-part messages", () => {
      const message: Message = {
        role: "user",
        parts: [
          { type: "text", text: "Please analyze this file:" },
          {
            type: "file",
            file: { url: "https://example.com/data.csv", mimeType: "text/csv" },
          },
          { type: "data", data: { format: "csv", columns: ["a", "b", "c"] } },
        ],
      };
      expect(message.parts).toHaveLength(3);
    });
  });

  describe("Tasks", () => {
    it("should support minimal task", () => {
      const task: Task = {
        id: "task-123",
        state: "submitted",
      };
      expect(task.id).toBe("task-123");
      expect(task.state).toBe("submitted");
    });

    it("should support full task", () => {
      const task: Task = {
        id: "task-123",
        state: "completed",
        contextId: "ctx-456",
        messages: [
          { role: "user", parts: [{ type: "text", text: "Hello" }] },
          { role: "agent", parts: [{ type: "text", text: "Hi there!" }] },
        ],
        artifacts: [
          {
            type: "artifact",
            artifact: { mimeType: "text/plain", content: "result" },
          },
        ],
        metadata: { priority: "high" },
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:01:00Z",
      };
      expect(task.messages).toHaveLength(2);
      expect(task.artifacts).toHaveLength(1);
    });

    it("should support failed task with error", () => {
      const task: Task = {
        id: "task-123",
        state: "failed",
        error: {
          code: "PROCESSING_ERROR",
          message: "Failed to process request",
          details: { reason: "timeout" },
        },
      };
      expect(task.state).toBe("failed");
      expect(task.error?.code).toBe("PROCESSING_ERROR");
    });
  });

  describe("Agent Card", () => {
    it("should support minimal agent card", () => {
      const card: AgentCard = {
        name: "Test Agent",
      };
      expect(card.name).toBe("Test Agent");
    });

    it("should support full agent card", () => {
      const card: AgentCard = {
        name: "Full Agent",
        description: "A fully configured agent",
        version: "1.0.0",
        provider: {
          name: "Test Provider",
          url: "https://example.com",
          email: "contact@example.com",
        },
        capabilities: {
          streaming: true,
          pushNotifications: true,
          extendedCards: true,
          multiTurn: true,
        },
        skills: [
          {
            id: "skill-1",
            name: "Skill One",
            description: "Does something useful",
            tags: ["utility", "text"],
            inputSchema: {
              type: "object",
              properties: { input: { type: "string" } },
            },
            outputSchema: {
              type: "object",
              properties: { output: { type: "string" } },
            },
            examples: [
              { input: "test", output: "result", description: "Example" },
            ],
          },
        ],
        securitySchemes: {
          bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
        },
        security: [{ bearer: [] }],
        protocols: [{ type: "jsonrpc", url: "https://example.com/rpc" }],
        defaultInputContentTypes: ["text/plain", "application/json"],
        defaultOutputContentTypes: ["text/plain", "application/json"],
        a2aVersion: "1.0",
        url: "https://example.com/.well-known/agent-card.json",
        extendedCardUrl: "https://example.com/agent/extended",
        metadata: { custom: "data" },
      };
      expect(card.capabilities?.streaming).toBe(true);
      expect(card.skills).toHaveLength(1);
    });

    it("should support all security scheme types", () => {
      const schemes: Record<string, SecurityScheme> = {
        apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
        bearer: { type: "http", scheme: "bearer" },
        basic: { type: "http", scheme: "basic" },
        oauth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: "https://example.com/auth",
              tokenUrl: "https://example.com/token",
              scopes: { read: "Read access", write: "Write access" },
            },
          },
        },
        openIdConnect: {
          type: "openIdConnect",
          openIdConnectUrl:
            "https://example.com/.well-known/openid-configuration",
        },
        mutualTLS: { type: "mutualTLS" },
      };

      expect(schemes.apiKey.type).toBe("apiKey");
      expect(schemes.bearer.type).toBe("http");
      expect(schemes.oauth2.type).toBe("oauth2");
      expect(schemes.openIdConnect.type).toBe("openIdConnect");
      expect(schemes.mutualTLS.type).toBe("mutualTLS");
    });
  });

  describe("Agent Capabilities", () => {
    it("should support standard capabilities", () => {
      const capabilities: AgentCapabilities = {
        streaming: true,
        pushNotifications: false,
        extendedCards: true,
        multiTurn: true,
      };
      expect(capabilities.streaming).toBe(true);
      expect(capabilities.pushNotifications).toBe(false);
    });

    it("should support custom capabilities", () => {
      const capabilities: AgentCapabilities = {
        streaming: true,
        customCapability: true,
      };
      expect(capabilities.customCapability).toBe(true);
    });
  });

  describe("Agent Skills", () => {
    it("should support minimal skill", () => {
      const skill: AgentSkill = {
        id: "echo",
        name: "Echo",
      };
      expect(skill.id).toBe("echo");
    });

    it("should support skill with schemas", () => {
      const skill: AgentSkill = {
        id: "transform",
        name: "Transform",
        description: "Transforms input data",
        tags: ["utility"],
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
            format: { type: "string", enum: ["json", "xml"] },
          },
          required: ["input"],
        },
        outputSchema: {
          type: "object",
          properties: {
            output: { type: "string" },
          },
        },
        examples: [{ input: { input: "test" }, output: { output: "TEST" } }],
      };
      expect(skill.inputSchema).toBeDefined();
      expect(skill.outputSchema).toBeDefined();
    });
  });

  describe("Push Notifications", () => {
    it("should support push notification config", () => {
      const config: PushNotificationConfig = {
        id: "config-1",
        taskId: "task-123",
        webhookUrl: "https://example.com/webhook",
        authentication: {
          type: "bearer",
          credentials: "secret-token",
        },
        events: ["status", "artifact", "message"],
        metadata: { source: "test" },
      };
      expect(config.webhookUrl).toBe("https://example.com/webhook");
      expect(config.events).toContain("status");
    });

    it("should support different auth types for push notifications", () => {
      const configs: PushNotificationConfig[] = [
        {
          id: "1",
          taskId: "task-1",
          webhookUrl: "https://example.com/webhook",
          authentication: { type: "bearer", credentials: "token" },
        },
        {
          id: "2",
          taskId: "task-2",
          webhookUrl: "https://example.com/webhook",
          authentication: { type: "basic", credentials: "dXNlcjpwYXNz" },
        },
        {
          id: "3",
          taskId: "task-3",
          webhookUrl: "https://example.com/webhook",
          authentication: {
            type: "apiKey",
            credentials: "key",
            headerName: "X-Webhook-Key",
          },
        },
      ];
      expect(configs).toHaveLength(3);
    });
  });

  describe("Streaming Events", () => {
    it("should support task status update event", () => {
      const event: TaskStatusUpdateEvent = {
        type: "task_status_update",
        taskId: "task-123",
        state: "working",
        message: {
          role: "agent",
          parts: [{ type: "text", text: "Processing..." }],
        },
        timestamp: "2024-01-01T00:00:00Z",
      };
      expect(event.type).toBe("task_status_update");
      expect(event.state).toBe("working");
    });

    it("should support task artifact update event", () => {
      const event: TaskArtifactUpdateEvent = {
        type: "task_artifact_update",
        taskId: "task-123",
        artifact: {
          type: "artifact",
          artifact: { mimeType: "text/plain", content: "result" },
        },
        timestamp: "2024-01-01T00:00:00Z",
      };
      expect(event.type).toBe("task_artifact_update");
    });

    it("should support StreamEvent union", () => {
      const events: StreamEvent[] = [
        {
          type: "task_status_update",
          taskId: "1",
          state: "working",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          type: "task_artifact_update",
          taskId: "1",
          artifact: {
            type: "artifact",
            artifact: { mimeType: "text/plain", content: "x" },
          },
          timestamp: "2024-01-01T00:00:00Z",
        },
      ];
      expect(events).toHaveLength(2);
    });
  });

  describe("JSON-RPC Types", () => {
    it("should support JSON-RPC request", () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "a2a.SendMessage",
        params: { message: { role: "user", parts: [] } },
        id: "req-123",
      };
      expect(request.jsonrpc).toBe("2.0");
      expect(request.method).toBe("a2a.SendMessage");
    });

    it("should support JSON-RPC success response", () => {
      const response: JsonRpcSuccessResponse<Task> = {
        jsonrpc: "2.0",
        result: { id: "task-1", state: "completed" },
        id: "req-123",
      };
      expect(response.result.id).toBe("task-1");
    });

    it("should support JSON-RPC error response", () => {
      const response: JsonRpcErrorResponse = {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Task not found",
          data: { taskId: "task-999" },
        },
        id: "req-123",
      };
      expect(response.error.code).toBe(-32001);
    });

    it("should support JSON-RPC response union", () => {
      const success: JsonRpcResponse<string> = {
        jsonrpc: "2.0",
        result: "ok",
        id: 1,
      };
      const error: JsonRpcResponse<string> = {
        jsonrpc: "2.0",
        error: { code: -32600, message: "Invalid request" },
        id: 1,
      };

      // Type guard to distinguish responses
      if ("result" in success) {
        expect(success.result).toBe("ok");
      }
      if ("error" in error) {
        expect(error.error.code).toBe(-32600);
      }
    });
  });

  describe("A2A Error Codes", () => {
    it("should define standard JSON-RPC error codes", () => {
      expect(A2AErrorCodes.PARSE_ERROR).toBe(-32700);
      expect(A2AErrorCodes.INVALID_REQUEST).toBe(-32600);
      expect(A2AErrorCodes.METHOD_NOT_FOUND).toBe(-32601);
      expect(A2AErrorCodes.INVALID_PARAMS).toBe(-32602);
      expect(A2AErrorCodes.INTERNAL_ERROR).toBe(-32603);
    });

    it("should define A2A-specific error codes", () => {
      expect(A2AErrorCodes.TASK_NOT_FOUND).toBe(-32001);
      expect(A2AErrorCodes.TASK_CANCELLED).toBe(-32002);
      expect(A2AErrorCodes.PUSH_NOTIFICATION_NOT_SUPPORTED).toBe(-32003);
      expect(A2AErrorCodes.VERSION_NOT_SUPPORTED).toBe(-32004);
      expect(A2AErrorCodes.CONTENT_TYPE_NOT_SUPPORTED).toBe(-32005);
      expect(A2AErrorCodes.AUTHENTICATION_REQUIRED).toBe(-32006);
      expect(A2AErrorCodes.AUTHORIZATION_FAILED).toBe(-32007);
      expect(A2AErrorCodes.RATE_LIMITED).toBe(-32008);
    });

    it("should use reserved range for A2A errors (-32000 to -32099)", () => {
      const a2aErrors = [
        A2AErrorCodes.TASK_NOT_FOUND,
        A2AErrorCodes.TASK_CANCELLED,
        A2AErrorCodes.PUSH_NOTIFICATION_NOT_SUPPORTED,
        A2AErrorCodes.VERSION_NOT_SUPPORTED,
        A2AErrorCodes.CONTENT_TYPE_NOT_SUPPORTED,
        A2AErrorCodes.AUTHENTICATION_REQUIRED,
        A2AErrorCodes.AUTHORIZATION_FAILED,
        A2AErrorCodes.RATE_LIMITED,
      ];

      a2aErrors.forEach((code) => {
        expect(code).toBeGreaterThanOrEqual(-32099);
        expect(code).toBeLessThanOrEqual(-32000);
      });
    });
  });

  describe("Request/Response Parameter Types", () => {
    it("should support SendMessageParams", () => {
      const params: SendMessageParams = {
        message: {
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
        config: {
          timeout: 30000,
          blocking: true,
        },
      };
      expect(params.message.role).toBe("user");
    });

    it("should support SendMessageResponse with task", () => {
      const response: SendMessageResponse = {
        task: { id: "task-1", state: "submitted" },
      };
      expect(response.task?.id).toBe("task-1");
    });

    it("should support SendMessageResponse with direct message", () => {
      const response: SendMessageResponse = {
        message: { role: "agent", parts: [{ type: "text", text: "Response" }] },
      };
      expect(response.message?.role).toBe("agent");
    });

    it("should support GetTaskParams", () => {
      const params: GetTaskParams = {
        taskId: "task-123",
        includeMessages: true,
        includeArtifacts: true,
      };
      expect(params.taskId).toBe("task-123");
    });

    it("should support ListTasksParams", () => {
      const params: ListTasksParams = {
        contextId: "ctx-123",
        status: ["working", "completed"],
        pageSize: 20,
        pageToken: "token-abc",
      };
      expect(params.status).toContain("working");
    });

    it("should support ListTasksResponse", () => {
      const response: ListTasksResponse = {
        tasks: [
          { id: "task-1", state: "completed" },
          { id: "task-2", state: "working" },
        ],
        nextPageToken: "next-token",
      };
      expect(response.tasks).toHaveLength(2);
    });

    it("should support CancelTaskParams", () => {
      const params: CancelTaskParams = {
        taskId: "task-123",
        reason: "User requested cancellation",
      };
      expect(params.reason).toBeDefined();
    });

    it("should support SubscribeToTaskParams", () => {
      const params: SubscribeToTaskParams = {
        taskId: "task-123",
        lastEventId: "event-456",
      };
      expect(params.lastEventId).toBe("event-456");
    });
  });
});
