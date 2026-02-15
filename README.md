# Warden Protocol Agent Kit

A TypeScript SDK for building and connecting AI agents. Create your own agents or communicate with existing ones using a simple, unified API.

## What You Can Do

- **Build AI Agents**: Create agents that respond to messages with streaming support
- **Dual Protocol Support**: Expose agents via both A2A and LangGraph APIs simultaneously
- **Connect to Agents**: Discover and communicate with remote agents using the A2A protocol
- **LangGraph Compatibility**: Agents can be consumed by LangGraph SDK clients
- **Stream Responses**: Real-time streaming via Server-Sent Events (SSE)
- **Manage Conversations**: Multi-turn conversations with context preservation

## Installation

```bash
npm install @wardenprotocol/agent-kit @langchain/langgraph-sdk
# or
pnpm add @wardenprotocol/agent-kit @langchain/langgraph-sdk
# or
yarn add @wardenprotocol/agent-kit @langchain/langgraph-sdk
```

## Build an Agent

Create an agent server in just a few lines of code:

```typescript
import { AgentServer } from "@wardenprotocol/agent-kit";

const server = new AgentServer({
  agentCard: {
    name: "My Agent",
    description: "A helpful assistant",
    url: "http://localhost:3000",
    capabilities: { streaming: true, multiTurn: true },
  },
  handler: async function* (context) {
    const userMessage = context.message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");

    yield {
      state: "completed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: `Echo: ${userMessage}` }],
      },
    };
  },
});

await server.listen(3000);
console.log("Agent server running on http://localhost:3000");
console.log("- A2A: POST / (JSON-RPC), GET /.well-known/agent-card.json");
console.log("- LangGraph: /assistants, /threads, /runs, /info");
```

Your agent is now accessible via both:
- **A2A clients**: Discovery at `GET /.well-known/agent-card.json`, JSON-RPC at `POST /`
- **LangGraph SDK clients**: REST API at `/assistants`, `/threads`, `/runs/*`

### Using with LangGraph SDK Client

```typescript
import { Client } from "@langchain/langgraph-sdk";

// Connect to your dual-protocol agent
const client = new Client({ apiUrl: "http://localhost:3000" });

// List assistants (returns your agent)
const assistants = await client.assistants.search();
console.log("Agent:", assistants[0].name);

// Create a thread
const thread = await client.threads.create();

// Stream a conversation
for await (const event of client.runs.stream(thread.thread_id, assistants[0].assistant_id, {
  input: { messages: [{ role: "user", content: "Hello!" }] },
  streamMode: "messages",
})) {
  if (event.event === "messages") {
    console.log("Response:", event.data);
  }
}
```

## Connect to Agents (A2A Client)

Discover and communicate with remote agents:

```typescript
import { createA2AOnlyClient, discoverAgent } from "@wardenprotocol/agent-kit";

// Discover what an agent can do
const agentCard = await discoverAgent("https://agent.example.com");
console.log("Agent:", agentCard.name);
console.log("Skills:", agentCard.skills);

// Create a client
const client = createA2AOnlyClient({
  url: "https://agent.example.com",
  auth: {
    type: "bearer",
    credentials: "your-api-token",
  },
});

// Send a message
const response = await client.sendText("Hello, agent!");

// Stream responses
for await (const event of client.streamText("Tell me a story")) {
  if (event.type === "task_status_update") {
    console.log("Status:", event.state);
    if (event.message) {
      console.log("Response:", event.message);
    }
  }
}

// Multi-turn conversation
const task1 = await client.sendText("My name is Alice", { contextId: "conv-1" });
const task2 = await client.sendText("What's my name?", { contextId: "conv-1" });
```

### Task Management

```typescript
// Get task status
const task = await client.getTask({ taskId: "task-123" });

// List all tasks
const { tasks } = await client.listTasks({ status: "completed" });

// Cancel a running task
await client.cancelTask({ taskId: "task-123" });

// Subscribe to task updates
for await (const event of client.subscribeToTask({ taskId: "task-123" })) {
  console.log("Update:", event);
}
```

## Server Endpoints

### A2A Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /.well-known/agent-card.json` | Agent discovery - returns capabilities and metadata |
| `POST /` | JSON-RPC endpoint for all A2A operations |

**A2A JSON-RPC methods:**
- `message/send` - Send a message and get a response
- `message/stream` - Send a message and stream the response (SSE)
- `tasks/get` - Get task status by ID
- `tasks/cancel` - Cancel a running task
- `tasks/resubscribe` - Subscribe to task updates

### LangGraph Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /info` | Server information |
| `GET /ok` | Health check |
| `POST /assistants/search` | List assistants |
| `GET /assistants/:id` | Get assistant details |
| `POST /threads` | Create a thread |
| `POST /threads/search` | List threads |
| `GET /threads/:id` | Get thread details |
| `GET /threads/:id/state` | Get thread state |
| `DELETE /threads/:id` | Delete a thread |
| `POST /runs/stream` | Create a stateless streaming run |
| `POST /runs/wait` | Create a stateless run and wait |
| `POST /threads/:id/runs` | Create a run on a thread |
| `POST /threads/:id/runs/stream` | Stream a run on a thread |
| `POST /threads/:id/runs/wait` | Run and wait on a thread |

## Type Definitions

Full TypeScript support with exported types:

```typescript
import type {
  // A2A types
  AgentCard,
  AgentSkill,
  Task,
  TaskState,
  Message,
  Part,
  TextPart,
  FilePart,
  DataPart,
  StreamEvent,
  TaskContext,
  TaskYieldUpdate,
  // LangGraph types
  LangGraphAssistant,
  LangGraphThread,
  LangGraphRun,
  LangGraphMessage,
} from "@wardenprotocol/agent-kit";
```

## Error Handling

```typescript
import { A2AError, TaskNotFoundError, A2AErrorCodes } from "@wardenprotocol/agent-kit";

try {
  const task = await client.getTask({ taskId: "invalid" });
} catch (error) {
  if (error instanceof TaskNotFoundError) {
    console.log("Task not found");
  } else if (error instanceof A2AError) {
    console.log("Error:", error.code, error.message);
    if (error.retryable) {
      console.log("This operation can be retried");
    }
  }
}
```

## License

MIT
