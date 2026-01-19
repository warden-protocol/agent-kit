/**
 * Warden SDK
 *
 * A wrapper around @langchain/langgraph-sdk with full A2A (Agent-to-Agent) protocol support.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main Client
// =============================================================================

export {
  WardenClient,
  WardenA2AClient,
  createClient,
  createA2AOnlyClient,
} from "./client.js";

export type { WardenClientConfig, A2AAgentOptions } from "./client.js";

// =============================================================================
// A2A Protocol
// =============================================================================

// Re-export everything from the A2A module
export * from "./a2a/index.js";

// =============================================================================
// LangGraph Protocol Server
// =============================================================================

// Re-export LangGraph server components
export {
  LangGraphServer,
  createLangGraphServer,
  AgentServer,
  createAgentServer,
  // Backwards compatibility aliases
  DualProtocolServer,
  createDualProtocolServer,
} from "./langgraph/index.js";

export type {
  LangGraphServerConfig,
  AgentServerConfig,
  // Backwards compatibility alias
  DualProtocolServerConfig,
} from "./langgraph/index.js";

// =============================================================================
// LangGraph SDK Re-exports
// =============================================================================

// Re-export commonly used types from @langchain/langgraph-sdk for convenience
export type {
  // Client types
  Client,
  ClientConfig,
  RequestHook,
  // Schema types
  Assistant,
  AssistantBase,
  AssistantGraph,
  AssistantVersion,
  AssistantsSearchResponse,
  Checkpoint,
  Config,
  Cron,
  CronCreateForThreadResponse,
  CronCreateResponse,
  DefaultValues,
  GraphSchema,
  Interrupt,
  Item,
  ListNamespaceResponse,
  Metadata,
  Run,
  SearchItem,
  SearchItemsResponse,
  Thread,
  ThreadState,
  ThreadStatus,
  ThreadTask,
  // Message types
  AIMessage,
  FunctionMessage,
  HumanMessage,
  Message as LangGraphMessage,
  RemoveMessage,
  SystemMessage,
  ToolMessage,
  // Stream types
  CustomStreamEvent,
  DebugStreamEvent,
  ErrorStreamEvent,
  EventsStreamEvent,
  FeedbackStreamEvent,
  MessagesStreamEvent,
  MessagesTupleStreamEvent,
  MetadataStreamEvent,
  StreamMode,
  UpdatesStreamEvent,
  ValuesStreamEvent,
  // Other types
  Command,
  OnConflictBehavior,
  RunsInvokePayload,
  BagTemplate,
} from "@langchain/langgraph-sdk";

// Re-export utilities
export {
  getApiKey,
  overrideFetchImplementation,
} from "@langchain/langgraph-sdk";
