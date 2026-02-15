# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## 0.5.0 (2026-02-15)

### Features

- A2A spec-compliant wire format — client sends standard method names (`message/send`, `message/stream`, `tasks/get`, `tasks/cancel`, `tasks/resubscribe`, `tasks/list`)
- Outgoing message parts automatically converted to wire format (`type` → `kind`) with auto-generated `messageId`
- SSE stream parser unwraps JSON-RPC envelopes and normalizes `kind`-based events (`status-update`, `artifact-update`, `task`) to internal format
- `discoverAgent()` now accepts `auth` and `headers` options for authenticated agent card discovery
- New `examples/` directory with echo server (`pnpm echo`) for quick A2A Inspector testing, OpenAI dual-protocol server (`pnpm agent`), and LangSmith client test (`pnpm test-langsmith`)

### Fixes

- LangSmith A2A compatibility — handle both `contextId` (camelCase) and `context_id` (snake_case) in task responses

### Improvements

- Examples reorganized from `example/` to `examples/` with `client/` and `server/` subdirectories

## 0.4.0 (2026-02-15)

### Features

- Task state transition validation via `VALID_TASK_TRANSITIONS` map and `canTransitionTask()` helper
- Retryable error metadata — internal server errors include `{ retryable: true }` in error data
- `A2AError.retryable` getter for clients to check if a failed operation can be retried

### Improvements

- `handleCancelTask()` returns `INVALID_PARAMS` error when attempting to cancel a task in a terminal state
- Promise-based message handlers now correctly transition through `working` before `completed`
- `createJsonRpcError()` accepts optional `data` parameter for richer error responses
