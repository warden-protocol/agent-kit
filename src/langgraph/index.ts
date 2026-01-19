/**
 * LangGraph Protocol Module
 *
 * This module provides LangGraph Platform API compatibility for agent-kit,
 * allowing agents to be consumed by LangGraph SDK clients.
 */

// Export types
export type {
  // Assistant types
  LangGraphAssistant,
  // Thread types
  ThreadStatus,
  LangGraphThread,
  LangGraphThreadState,
  LangGraphCheckpoint,
  // Run types
  RunStatus,
  LangGraphRun,
  LangGraphTask,
  LangGraphInterrupt,
  // Stream types
  StreamMode,
  StreamEventBase,
  ValuesStreamEvent,
  UpdatesStreamEvent,
  MessagesStreamEvent,
  MetadataStreamEvent,
  ErrorStreamEvent,
  EndStreamEvent,
  LangGraphStreamEvent,
  // Message types
  LangGraphMessageRole,
  MessageContent,
  LangGraphMessage,
  ToolCall,
  // Request/Response types
  RunCreateRequest,
  ThreadCreateRequest,
  ThreadStateUpdateRequest,
  AssistantSearchRequest,
  ThreadSearchRequest,
  ServerInfo,
} from "./types.js";

// Export server
export { LangGraphServer, createLangGraphServer } from "./server.js";

export type { LangGraphServerConfig } from "./server.js";

// Export agent server (primary API)
export {
  AgentServer,
  createAgentServer,
  // Backwards compatibility aliases
  DualProtocolServer,
  createDualProtocolServer,
} from "./dual-server.js";

export type {
  AgentServerConfig,
  // Backwards compatibility alias
  DualProtocolServerConfig,
} from "./dual-server.js";
