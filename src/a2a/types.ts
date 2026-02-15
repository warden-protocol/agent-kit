/**
 * A2A Protocol Types
 *
 * Based on the Agent2Agent (A2A) Protocol specification.
 * @see https://a2a-protocol.org/latest/specification/
 */

// ============================================================================
// Task Lifecycle States
// ============================================================================

/**
 * Represents the lifecycle state of a task.
 *
 * State transitions:
 * - SUBMITTED → WORKING → COMPLETED (terminal)
 * - SUBMITTED → WORKING → INPUT_REQUIRED → WORKING → COMPLETED
 * - SUBMITTED → WORKING → FAILED (terminal)
 * - SUBMITTED → CANCELLED (terminal)
 * - SUBMITTED → REJECTED (terminal)
 * - SUBMITTED → AUTH_REQUIRED → WORKING → COMPLETED
 */
export type TaskState =
  | "submitted"
  | "working"
  | "input_required"
  | "completed"
  | "failed"
  | "cancelled"
  | "rejected"
  | "auth_required";

/**
 * Terminal states where the task cannot progress further.
 */
export const TERMINAL_TASK_STATES: TaskState[] = [
  "completed",
  "failed",
  "cancelled",
  "rejected",
];

/** Valid state transitions for tasks. */
export const VALID_TASK_TRANSITIONS: Record<string, readonly TaskState[]> = {
  submitted: ["working", "cancelled", "rejected"],
  working: ["completed", "failed", "cancelled", "input_required"],
  input_required: ["working", "cancelled"],
  auth_required: ["working", "cancelled"],
};

/** Check whether a state transition is valid. */
export function canTransitionTask(from: TaskState, to: TaskState): boolean {
  return VALID_TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// Message Parts
// ============================================================================

/**
 * Base interface for all message parts.
 */
export interface PartBase {
  /** Optional metadata for the part */
  metadata?: Record<string, unknown>;
}

/**
 * A text content part.
 */
export interface TextPart extends PartBase {
  type: "text";
  /** The text content */
  text: string;
}

/**
 * A file reference part.
 */
export interface FilePart extends PartBase {
  type: "file";
  /** The file reference */
  file: {
    /** URL to the file */
    url?: string;
    /** Base64 encoded file content */
    base64?: string;
    /** MIME type of the file */
    mimeType?: string;
    /** Original filename */
    name?: string;
  };
}

/**
 * A structured data part for JSON/form data.
 */
export interface DataPart extends PartBase {
  type: "data";
  /** The structured data */
  data: Record<string, unknown>;
}

/**
 * An artifact part with embedded content.
 */
export interface ArtifactPart extends PartBase {
  type: "artifact";
  /** The artifact content */
  artifact: {
    /** Artifact identifier */
    id?: string;
    /** Artifact name */
    name?: string;
    /** MIME type */
    mimeType: string;
    /** The artifact content (string or base64) */
    content: string;
    /** Optional description */
    description?: string;
  };
}

/**
 * Union type of all message parts.
 */
export type Part = TextPart | FilePart | DataPart | ArtifactPart;

// ============================================================================
// Messages
// ============================================================================

/**
 * Role of the message sender.
 */
export type MessageRole = "user" | "agent";

/**
 * A message in the A2A protocol.
 */
export interface Message {
  /** Role of the sender */
  role: MessageRole;
  /** Content parts of the message */
  parts: Part[];
  /** Optional context ID for grouping related messages */
  contextId?: string;
  /** Optional task ID this message relates to */
  taskId?: string;
  /** Optional message metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Tasks
// ============================================================================

/**
 * Represents a task in the A2A protocol.
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  /** Current state of the task */
  state: TaskState;
  /** Context ID for conversational continuity */
  contextId?: string;
  /** Messages associated with this task */
  messages?: Message[];
  /** Artifacts produced by the task */
  artifacts?: ArtifactPart[];
  /** Task metadata */
  metadata?: Record<string, unknown>;
  /** Error information if state is 'failed' */
  error?: TaskError;
  /** Timestamp when the task was created */
  createdAt?: string;
  /** Timestamp when the task was last updated */
  updatedAt?: string;
}

/**
 * Error information for a failed task.
 */
export interface TaskError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

// ============================================================================
// Agent Card
// ============================================================================

/**
 * Security scheme types supported by A2A.
 */
export type SecuritySchemeType =
  | "apiKey"
  | "http"
  | "oauth2"
  | "openIdConnect"
  | "mutualTLS";

/**
 * API Key security scheme.
 */
export interface ApiKeySecurityScheme {
  type: "apiKey";
  /** Location of the API key */
  in: "header" | "query" | "cookie";
  /** Name of the header/query/cookie parameter */
  name: string;
  /** Optional description */
  description?: string;
}

/**
 * HTTP authentication security scheme.
 */
export interface HttpSecurityScheme {
  type: "http";
  /** HTTP authentication scheme (e.g., "bearer", "basic") */
  scheme: string;
  /** Optional bearer format */
  bearerFormat?: string;
  /** Optional description */
  description?: string;
}

/**
 * OAuth2 security scheme.
 */
export interface OAuth2SecurityScheme {
  type: "oauth2";
  /** OAuth2 flows configuration */
  flows: {
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    clientCredentials?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    implicit?: {
      authorizationUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    password?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
  };
  /** Optional description */
  description?: string;
}

/**
 * OpenID Connect security scheme.
 */
export interface OpenIdConnectSecurityScheme {
  type: "openIdConnect";
  /** OpenID Connect discovery URL */
  openIdConnectUrl: string;
  /** Optional description */
  description?: string;
}

/**
 * Mutual TLS security scheme.
 */
export interface MutualTLSSecurityScheme {
  type: "mutualTLS";
  /** Optional description */
  description?: string;
}

/**
 * Union type of all security schemes.
 */
export type SecurityScheme =
  | ApiKeySecurityScheme
  | HttpSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme;

/**
 * A skill that an agent can perform.
 */
export interface AgentSkill {
  /** Unique skill identifier */
  id: string;
  /** Human-readable skill name */
  name: string;
  /** Description of what the skill does */
  description?: string;
  /** Tags for categorization (required by A2A spec) */
  tags: string[];
  /** Input schema (JSON Schema) */
  inputSchema?: Record<string, unknown>;
  /** Output schema (JSON Schema) */
  outputSchema?: Record<string, unknown>;
  /** Example inputs/outputs */
  examples?: Array<{
    input?: unknown;
    output?: unknown;
    description?: string;
  }>;
}

/**
 * Protocol binding information.
 */
export interface ProtocolBinding {
  /** Protocol type */
  type: "jsonrpc" | "grpc" | "http";
  /** Endpoint URL */
  url: string;
  /** Optional additional configuration */
  config?: Record<string, unknown>;
}

/**
 * Agent capabilities declaration.
 */
export interface AgentCapabilities {
  /** Whether the agent supports streaming responses */
  streaming?: boolean;
  /** Whether the agent supports push notifications */
  pushNotifications?: boolean;
  /** Whether the agent supports extended agent cards */
  extendedCards?: boolean;
  /** Whether the agent supports multi-turn conversations */
  multiTurn?: boolean;
  /** Custom capability flags */
  [key: string]: boolean | undefined;
}

/**
 * Provider information for an agent.
 */
export interface AgentProvider {
  /** Provider name */
  name: string;
  /** Organization name */
  organization: string;
  /** Provider URL */
  url?: string;
  /** Contact email */
  email?: string;
}

/**
 * Agent Card - describes an agent's identity, capabilities, and security requirements.
 */
export interface AgentCard {
  /** Agent name */
  name: string;
  /** URL to the agent */
  url: string;
  /** Agent description */
  description?: string;
  /** Agent version */
  version?: string;
  /** Provider information */
  provider?: AgentProvider;
  /** Agent capabilities */
  capabilities?: AgentCapabilities;
  /** Default input modes (e.g., "text", "audio", "video"). Defaults to ["text"] */
  defaultInputModes?: string[];
  /** Default output modes (e.g., "text", "audio", "video"). Defaults to ["text"] */
  defaultOutputModes?: string[];
  /** Skills the agent can perform */
  skills?: AgentSkill[];
  /** Security schemes */
  securitySchemes?: Record<string, SecurityScheme>;
  /** Security requirements (which schemes are required) */
  security?: Array<Record<string, string[]>>;
  /** Protocol bindings */
  protocols?: ProtocolBinding[];
  /** Default input content types */
  defaultInputContentTypes?: string[];
  /** Default output content types */
  defaultOutputContentTypes?: string[];
  /** A2A protocol version */
  a2aVersion?: string;
  /** URL to the extended agent card (requires authentication) */
  extendedCardUrl?: string;
  /** Agent card metadata */
  metadata?: Record<string, unknown>;
  /** Cryptographic signature for card integrity */
  signature?: {
    algorithm: string;
    value: string;
    keyId?: string;
  };
}

// ============================================================================
// Push Notifications
// ============================================================================

/**
 * Configuration for push notifications.
 */
export interface PushNotificationConfig {
  /** Unique configuration ID */
  id: string;
  /** Task ID to receive notifications for */
  taskId: string;
  /** Webhook URL to send notifications to */
  webhookUrl: string;
  /** Authentication for the webhook */
  authentication?: {
    type: "bearer" | "basic" | "apiKey";
    credentials: string;
    /** For apiKey type, the header name */
    headerName?: string;
  };
  /** Event types to subscribe to */
  events?: Array<"status" | "artifact" | "message">;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Streaming Events
// ============================================================================

/**
 * Task status update event.
 */
export interface TaskStatusUpdateEvent {
  type: "task_status_update";
  /** Task ID */
  taskId: string;
  /** New task state */
  state: TaskState;
  /** Optional message with the update */
  message?: Message;
  /** Timestamp */
  timestamp: string;
}

/**
 * Task artifact update event.
 */
export interface TaskArtifactUpdateEvent {
  type: "task_artifact_update";
  /** Task ID */
  taskId: string;
  /** The artifact */
  artifact: ArtifactPart;
  /** Timestamp */
  timestamp: string;
}

/**
 * Union type of all streaming events.
 */
export type StreamEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

// ============================================================================
// JSON-RPC Types
// ============================================================================

/**
 * JSON-RPC request structure.
 */
export interface JsonRpcRequest<T = unknown> {
  jsonrpc: "2.0";
  method: string;
  params?: T;
  id: string | number;
}

/**
 * JSON-RPC success response.
 */
export interface JsonRpcSuccessResponse<T = unknown> {
  jsonrpc: "2.0";
  result: T;
  id: string | number;
}

/**
 * JSON-RPC error object.
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * JSON-RPC error response.
 */
export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  error: JsonRpcError;
  id: string | number | null;
}

/**
 * Union type of JSON-RPC responses.
 */
export type JsonRpcResponse<T = unknown> =
  | JsonRpcSuccessResponse<T>
  | JsonRpcErrorResponse;

// ============================================================================
// A2A Protocol Errors
// ============================================================================

/**
 * Standard A2A error codes.
 */
export const A2AErrorCodes = {
  // JSON-RPC standard errors
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,

  // A2A specific errors (using -32000 to -32099 range)
  TASK_NOT_FOUND: -32001,
  TASK_CANCELLED: -32002,
  PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
  VERSION_NOT_SUPPORTED: -32004,
  CONTENT_TYPE_NOT_SUPPORTED: -32005,
  AUTHENTICATION_REQUIRED: -32006,
  AUTHORIZATION_FAILED: -32007,
  RATE_LIMITED: -32008,
} as const;

export type A2AErrorCode = (typeof A2AErrorCodes)[keyof typeof A2AErrorCodes];

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Send message request parameters.
 */
export interface SendMessageParams {
  /** The message to send */
  message: Message;
  /** Configuration for the request */
  config?: {
    /** Timeout in milliseconds */
    timeout?: number;
    /** Whether to block until completion */
    blocking?: boolean;
  };
}

/**
 * Send message response.
 */
export interface SendMessageResponse {
  /** The task created or updated */
  task?: Task;
  /** Direct response message (for simple request/response) */
  message?: Message;
}

/**
 * Get task request parameters.
 */
export interface GetTaskParams {
  /** Task ID */
  taskId: string;
  /** Whether to include messages */
  includeMessages?: boolean;
  /** Whether to include artifacts */
  includeArtifacts?: boolean;
}

/**
 * List tasks request parameters.
 */
export interface ListTasksParams {
  /** Filter by context ID */
  contextId?: string;
  /** Filter by status */
  status?: TaskState | TaskState[];
  /** Maximum number of results */
  pageSize?: number;
  /** Pagination token */
  pageToken?: string;
}

/**
 * List tasks response.
 */
export interface ListTasksResponse {
  /** Tasks matching the query */
  tasks: Task[];
  /** Next page token */
  nextPageToken?: string;
}

/**
 * Cancel task request parameters.
 */
export interface CancelTaskParams {
  /** Task ID */
  taskId: string;
  /** Reason for cancellation */
  reason?: string;
}

/**
 * Subscribe to task request parameters.
 */
export interface SubscribeToTaskParams {
  /** Task ID */
  taskId: string;
  /** Last event ID for resumption */
  lastEventId?: string;
}


// ============================================================================
// Developer Convenience Types
// ============================================================================

/**
 * Alias for Part - represents a message part (text, file, data, or artifact).
 * This alias is provided for developer convenience and template compatibility.
 */
export type MessagePart = Part;

/**
 * Context provided to message handlers.
 * Contains the current task and the incoming message.
 */
export interface TaskContext {
  /** The current task being processed */
  task: Task;
  /** The incoming message that triggered this task */
  message: Message;
}

/**
 * Update yielded by task handlers to report progress.
 * Used by streaming handlers to update task state and send messages.
 */
export interface TaskYieldUpdate {
  /** The new state of the task */
  state: TaskState;
  /** Optional message to include with the update */
  message?: Message;
}
