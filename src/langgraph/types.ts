/**
 * LangGraph Protocol Types
 *
 * Minimal type definitions for LangGraph Platform API compatibility.
 * These types allow agents built with agent-kit to be consumed by
 * LangGraph SDK clients.
 */

// =============================================================================
// Assistant Types
// =============================================================================

/**
 * Represents an assistant (agent) in the LangGraph API.
 */
export interface LangGraphAssistant {
  assistant_id: string;
  graph_id: string;
  name?: string;
  description?: string;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  version: number;
}

// =============================================================================
// Thread Types
// =============================================================================

/**
 * Thread status in the LangGraph API.
 */
export type ThreadStatus = "idle" | "busy" | "interrupted" | "error";

/**
 * Represents a conversation thread.
 */
export interface LangGraphThread {
  thread_id: string;
  status: ThreadStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  values?: Record<string, unknown>;
}

/**
 * Thread state including messages and checkpoint info.
 */
export interface LangGraphThreadState {
  values: Record<string, unknown>;
  next: string[];
  tasks: LangGraphTask[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  checkpoint?: LangGraphCheckpoint;
  parent_checkpoint?: LangGraphCheckpoint;
}

/**
 * Checkpoint information for thread state.
 */
export interface LangGraphCheckpoint {
  thread_id: string;
  checkpoint_ns: string;
  checkpoint_id: string;
  checkpoint_map?: Record<string, unknown>;
}

// =============================================================================
// Run Types
// =============================================================================

/**
 * Run status in the LangGraph API.
 */
export type RunStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "timeout"
  | "interrupted";

/**
 * Represents a run (execution) of an assistant.
 */
export interface LangGraphRun {
  run_id: string;
  thread_id: string;
  assistant_id: string;
  status: RunStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  multitask_strategy?: string;
}

/**
 * Task within a run.
 */
export interface LangGraphTask {
  id: string;
  name: string;
  path?: (string | number)[];
  error?: string;
  interrupts?: LangGraphInterrupt[];
  state?: Record<string, unknown>;
  result?: unknown;
}

/**
 * Interrupt information.
 */
export interface LangGraphInterrupt {
  value: unknown;
  when: "during" | "after";
  resumable: boolean;
  ns?: string[];
}

// =============================================================================
// Stream Types
// =============================================================================

/**
 * Stream modes supported by the LangGraph API.
 */
export type StreamMode =
  | "values"
  | "updates"
  | "messages"
  | "messages-tuple"
  | "events"
  | "debug"
  | "custom";

/**
 * Base stream event.
 */
export interface StreamEventBase {
  event: string;
  data: unknown;
}

/**
 * Values stream event - emits full state after each step.
 */
export interface ValuesStreamEvent extends StreamEventBase {
  event: "values";
  data: Record<string, unknown>;
}

/**
 * Updates stream event - emits state updates from each node.
 */
export interface UpdatesStreamEvent extends StreamEventBase {
  event: "updates";
  data: Record<string, unknown>;
}

/**
 * Messages stream event - emits messages as they're generated.
 */
export interface MessagesStreamEvent extends StreamEventBase {
  event: "messages";
  data: LangGraphMessage[];
}

/**
 * Metadata stream event - emits run metadata.
 */
export interface MetadataStreamEvent extends StreamEventBase {
  event: "metadata";
  data: {
    run_id: string;
    thread_id?: string;
    assistant_id?: string;
  };
}

/**
 * Error stream event.
 */
export interface ErrorStreamEvent extends StreamEventBase {
  event: "error";
  data: {
    message: string;
    code?: string;
  };
}

/**
 * End stream event.
 */
export interface EndStreamEvent extends StreamEventBase {
  event: "end";
  data: null;
}

/**
 * Union of all stream events.
 */
export type LangGraphStreamEvent =
  | ValuesStreamEvent
  | UpdatesStreamEvent
  | MessagesStreamEvent
  | MetadataStreamEvent
  | ErrorStreamEvent
  | EndStreamEvent;

// =============================================================================
// Message Types (LangChain format)
// =============================================================================

/**
 * Message role in LangChain format.
 */
export type LangGraphMessageRole =
  | "human"
  | "ai"
  | "system"
  | "tool"
  | "function";

/**
 * Message content can be string or structured.
 */
export type MessageContent =
  | string
  | Array<{ type: string; text?: string; [key: string]: unknown }>;

/**
 * LangChain-style message.
 */
export interface LangGraphMessage {
  type: LangGraphMessageRole;
  content: MessageContent;
  id?: string;
  name?: string;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

/**
 * Tool call information.
 */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  type?: "tool_call";
}

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Request to create a run.
 */
export interface RunCreateRequest {
  assistant_id: string;
  thread_id?: string;
  input?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  config?: {
    tags?: string[];
    recursion_limit?: number;
    configurable?: Record<string, unknown>;
  };
  stream_mode?: StreamMode | StreamMode[];
  interrupt_before?: string[];
  interrupt_after?: string[];
  webhook?: string;
  multitask_strategy?: "reject" | "interrupt" | "rollback" | "enqueue";
  on_completion?: "delete" | "keep";
  on_disconnect?: "cancel" | "continue";
  after_seconds?: number;
}

/**
 * Request to create a thread.
 */
export interface ThreadCreateRequest {
  thread_id?: string;
  metadata?: Record<string, unknown>;
  if_exists?: "raise" | "do_nothing";
}

/**
 * Request to update thread state.
 */
export interface ThreadStateUpdateRequest {
  values: Record<string, unknown>;
  as_node?: string;
  checkpoint_id?: string;
}

/**
 * Search request for assistants.
 */
export interface AssistantSearchRequest {
  graph_id?: string;
  metadata?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

/**
 * Search request for threads.
 */
export interface ThreadSearchRequest {
  metadata?: Record<string, unknown>;
  status?: ThreadStatus;
  limit?: number;
  offset?: number;
}

/**
 * Request to patch/update a thread.
 */
export interface ThreadPatchRequest {
  metadata?: Record<string, unknown>;
}

/**
 * Request for thread history (POST).
 */
export interface ThreadHistoryRequest {
  limit?: number;
  before?: string;
  metadata?: Record<string, unknown>;
  checkpoint?: LangGraphCheckpoint;
}

/**
 * Thread history entry (state snapshot).
 */
export interface ThreadHistoryEntry {
  values: Record<string, unknown>;
  next: string[];
  tasks: LangGraphTask[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  checkpoint: LangGraphCheckpoint;
  parent_checkpoint?: LangGraphCheckpoint;
}

// =============================================================================
// Server Info
// =============================================================================

/**
 * Server info response.
 */
export interface ServerInfo {
  version: string;
  langgraph_api_version?: string;
}
