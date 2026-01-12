# AgentKit Example Agent

An LLM-powered AI agent built with `@warden-protocol/agentkit` and OpenAI. Demonstrates how to create a fully functional AI assistant that supports streaming responses and multi-turn conversations.

## What This Agent Does

The agent is a conversational AI assistant powered by OpenAI's GPT models. It:

- Responds to natural language messages
- Maintains conversation history per context (multi-turn support)
- Streams responses in real-time via SSE
- Handles errors gracefully

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

The agent will start on `http://localhost:3000`.

## Testing the Agent

### Using curl

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

### Using the Test Client

```bash
# Start the agent first, then in another terminal:
pnpm test-client
```

## Project Structure

```
example/
├── src/
│   ├── agent.ts        # Main agent server with OpenAI integration
│   ├── client-test.ts  # Test client for the agent
│   └── index.ts        # Basic SDK usage examples
├── package.json
└── README.md
```

## How It Works

The agent is built using `createA2AServer()` with OpenAI for LLM capabilities:

```typescript
import OpenAI from "openai";
import { createA2AServer } from "@warden-protocol/agentkit";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const server = createA2AServer({
  agentCard: {
    name: "My Agent",
    url: "http://localhost:3000",
    capabilities: { streaming: true, multiTurn: true },
    // ...
  },

  async *handleMessage(message) {
    // Extract user text
    const userText = message.parts.find(p => p.type === "text")?.text;

    // Yield working status
    yield { type: "task_status_update", state: "working", ... };

    // Call OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userText }],
      stream: true,
    });

    // Collect response
    let response = "";
    for await (const chunk of stream) {
      response += chunk.choices[0]?.delta?.content || "";
    }

    // Yield completed status
    yield {
      type: "task_status_update",
      state: "completed",
      message: { role: "agent", parts: [{ type: "text", text: response }] },
      ...
    };
  },
});

await server.listen(3000);
```

The server automatically:
- Serves the agent card at `/.well-known/agent-card.json`
- Handles `message/send` and `message/stream` requests
- Manages task state and IDs
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
