# AgentKit Examples

Client and server examples for the `@wardenprotocol/agent-kit` SDK.

## Setup

```bash
pnpm install
```

## Server Examples

### Echo Agent (no API keys needed)

```bash
pnpm echo
```

Starts a minimal A2A server on `http://localhost:3000` that echoes back messages. Great for testing with the [A2A Inspector](https://github.com/a2aproject/a2a-inspector) or any A2A client.

For Docker-based tools (like A2A Inspector), use:

```bash
HOST=host.docker.internal pnpm echo
```

### OpenAI Agent (A2A + LangGraph)

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
pnpm agent
```

Starts a dual-protocol agent powered by OpenAI, serving both A2A and LangGraph on the same port.

## Client Examples

### A2A Client Test

```bash
# Start a server first, then:
pnpm test-client
```

### SDK Usage Overview

```bash
pnpm dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm echo` | Start echo agent (no API key needed) |
| `pnpm agent` | Start OpenAI dual-protocol agent |
| `pnpm test-client` | Run A2A client test against a running agent |
| `pnpm dev` | Run SDK usage overview |

## Structure

```
examples/
├── server/
│   ├── echo.ts       # Minimal echo agent (A2A only)
│   └── agent.ts      # OpenAI agent (A2A + LangGraph)
├── client/
│   ├── client-test.ts  # A2A client test
│   └── index.ts        # SDK usage overview
├── .env.example
└── package.json
```
