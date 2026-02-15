# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## 0.4.0 (2026-02-15)

### Features

- Task state transition validation via `VALID_TASK_TRANSITIONS` map and `canTransitionTask()` helper
- Retryable error metadata — internal server errors include `{ retryable: true }` in error data
- `A2AError.retryable` getter for clients to check if a failed operation can be retried

### Improvements

- `handleCancelTask()` returns `INVALID_PARAMS` error when attempting to cancel a task in a terminal state
- Promise-based message handlers now correctly transition through `working` before `completed`
- `createJsonRpcError()` accepts optional `data` parameter for richer error responses
