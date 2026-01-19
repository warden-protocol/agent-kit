# AgentKit Example Agent

An LLM-powered AI agent built with `@wardenprotocol/agent-kit` and OpenAI. Demonstrates how to create a fully functional AI assistant that supports **both A2A and LangGraph protocols** simultaneously.

## What This Agent Does

The agent is a conversational AI assistant powered by OpenAI's GPT models. It:

- Responds to natural language messages
- Maintains conversation history per context (multi-turn support)
- Streams responses in real-time via SSE
- Handles errors gracefully
- **Supports both A2A and LangGraph protocols on the same port**

## Running the Agent

```bash
# Install dependencies
pnpm install

# Copy the example env file and add your OpenAI API key
cp .env.example .env
# Edit .env and set OPENAI_API_KEY

# Start the agent server
pnpm agent
```

The agent will start on `http://localhost:3000` with both protocols available.

## Protocol Endpoints

### A2A Protocol
- `GET /.well-known/agent-card.json` - Agent discovery
- `POST /` - JSON-RPC endpoint for `message/send`, `message/stream`, `tasks/get`, etc.

### LangGraph Protocol
- `GET /info` - Server information
- `GET /ok` - Health check
- `/assistants/*` - Assistant management
- `/threads/*` - Thread management
- `/runs/*` - Run management

## Testing the Agent

### Using curl (A2A Protocol)

```bash
# Send a message
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"kind": "text", "text": "Hello! What can you help me with?"}],
        "message_id": "test-1"
      }
    }
  }'

# Stream a response
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "message/stream",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"kind": "text", "text": "Tell me a short joke"}],
        "message_id": "test-2"
      }
    }
  }'
```

### Using curl (LangGraph Protocol)

```bash
# Get server info
curl http://localhost:3000/info

# List assistants
curl http://localhost:3000/assistants/search

# Create a thread
curl -X POST http://localhost:3000/threads \
  -H "Content-Type: application/json" \
  -d '{}'

# Run a completion (replace THREAD_ID and ASSISTANT_ID)
curl -X POST "http://localhost:3000/threads/THREAD_ID/runs" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "ASSISTANT_ID",
    "input": {
      "messages": [{"role": "user", "content": "Hello!"}]
    }
  }'
```

### Using the Test Client

```bash
# Start the agent first, then in another terminal:
pnpm test-client
```

## Project Structure

```
example/
├── src/
│   ├── agent.ts        # Main agent server with dual protocol support
│   ├── client-test.ts  # Test client for the agent
│   └── index.ts        # SDK usage examples (A2A + LangGraph)
├── package.json
└── README.md
```

## How It Works

The agent uses `AgentServer` which exposes both protocols on a single port:

```typescript
import OpenAI from "openai";
import { AgentServer, type TaskContext, type TaskYieldUpdate } from "@wardenprotocol/agent-kit";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Task handler - the core logic for processing messages
async function* handleTask(context: TaskContext): AsyncGenerator<TaskYieldUpdate> {
  const userText = context.message.parts
    .filter(p => p.type === "text")
    .map(p => p.text)
    .join("\n");

  // Yield working status
  yield { state: "working" };

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: userText }],
  });

  // Yield completed status with response
  yield {
    state: "completed",
    message: {
      role: "agent",
      parts: [{ type: "text", text: completion.choices[0].message.content }]
    }
  };
}

// Create agent server
const server = new AgentServer({
  agentCard: {
    name: "My Agent",
    url: "http://localhost:3000",
    capabilities: { streaming: true, multiTurn: true },
  },
  handler: handleTask,
});

await server.listen(3000);
```

The server automatically:
- Routes A2A requests to `POST /` and `/.well-known/agent-card.json`
- Routes LangGraph requests to `/assistants/*`, `/threads/*`, `/runs/*`
- Manages task/thread state internally
- Supports both streaming (SSE) and synchronous responses

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | (required) | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use |
| `PORT` | `3000` | Server port |
| `HOST` | `localhost` | Hostname for agent card URL |

For Docker access (e.g., A2A Inspector), use:

```bash
HOST=host.docker.internal OPENAI_API_KEY=your-key pnpm agent
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm agent` | Start the agent server |
| `pnpm test-client` | Run the test client |
| `pnpm build` | Build TypeScript |
| `pnpm dev` | Run with ts-node (development) |
