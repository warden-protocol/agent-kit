/**
 * A2A Protocol Module
 *
 * This module provides full support for the Agent2Agent (A2A) Protocol,
 * enabling communication and interoperability between AI agents.
 *
 * @see https://a2a-protocol.org/latest/specification/
 */

// Export all types
export type {
  // Task states
  TaskState,
  // Message parts
  Part,
  PartBase,
  TextPart,
  FilePart,
  DataPart,
  ArtifactPart,
  // Messages
  MessageRole,
  Message,
  // Tasks
  Task,
  TaskError,
  // Agent Card
  SecuritySchemeType,
  SecurityScheme,
  ApiKeySecurityScheme,
  HttpSecurityScheme,
  OAuth2SecurityScheme,
  OpenIdConnectSecurityScheme,
  MutualTLSSecurityScheme,
  AgentSkill,
  ProtocolBinding,
  AgentCapabilities,
  AgentProvider,
  AgentCard,
  // Push Notifications
  PushNotificationConfig,
  // Streaming
  StreamEvent,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  // JSON-RPC
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  JsonRpcError,
  // Request/Response
  SendMessageParams,
  SendMessageResponse,
  GetTaskParams,
  ListTasksParams,
  ListTasksResponse,
  CancelTaskParams,
  SubscribeToTaskParams,
  // Error codes
  A2AErrorCode,
} from "./types.js";

// Export constants
export { TERMINAL_TASK_STATES, A2AErrorCodes } from "./types.js";

// Export client
export {
  A2AClient,
  A2AError,
  TaskNotFoundError,
  AuthenticationRequiredError,
  VersionNotSupportedError,
  createA2AClient,
  discoverAgent,
} from "./client.js";

export type { A2AClientConfig } from "./client.js";

// Export server
export { A2AServer, createA2AServer } from "./server.js";

export type {
  A2AServerConfig,
  A2ARequestHandler,
  MessageHandler,
} from "./server.js";
