# Warden Protocol Agent Kit

A TypeScript SDK for building and connecting AI agents. Create your own agents or communicate with existing ones using a simple, unified API.

## What You Can Do

- **Build AI Agents**: Create agents that respond to messages with streaming support
- **Connect to Agents**: Discover and communicate with remote agents using the A2A protocol
- **Stream Responses**: Real-time streaming via Server-Sent Events (SSE)
- **Manage Conversations**: Multi-turn conversations with context preservation
- **LangGraph Integration**: Full compatibility with `@langchain/langgraph-sdk`

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
import { createA2AServer } from "@wardenprotocol/agent-kit";

const server = createA2AServer({
  agentCard: {
    name: "My Agent",
    description: "A helpful assistant",
    url: "http://localhost:3000",
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
  },

  // Implement your message handler
  async *handleMessage(message) {
    const text = message.parts.find((p) => p.type === "text")?.text ?? "";

    // Stream a "working" status
    yield {
      type: "task_status_update",
      taskId: "",
      state: "working",
      timestamp: new Date().toISOString(),
    };

    // Process the message (call an LLM, run logic, etc.)
    const result = await processMessage(text);

    // Stream the completed response
    yield {
      type: "task_status_update",
      taskId: "",
      state: "completed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: result }],
      },
      timestamp: new Date().toISOString(),
    };
  },
});

await server.listen(3000);
```

Your agent is now discoverable at `http://localhost:3000/.well-known/agent-card.json` and ready to receive messages.

### Simple Request/Response

If you don't need streaming, use a simple async function:

```typescript
const server = createA2AServer({
  agentCard: { /* ... */ },

  async handleMessage(message) {
    const text = message.parts.find((p) => p.type === "text")?.text ?? "";
    return {
      role: "agent",
      parts: [{ type: "text", text: `You said: ${text}` }],
    };
  },
});
```

### Update Agent Card at Runtime

```typescript
// Get current card
const card = server.getAgentCard();

// Update description
server.updateAgentCard({ description: "Updated description" });

// Add a skill dynamically
server.updateAgentCard((card) => ({
  ...card,
  skills: [...(card.skills || []), { id: "new-skill", name: "New Skill" }],
}));
```

### Integrate with Express/Fastify

```typescript
import express from "express";
import { createA2AServer } from "@wardenprotocol/agent-kit";

const a2aServer = createA2AServer({ /* config */ });
const app = express();

app.use("/", async (req, res) => {
  await a2aServer.getHandler()(req, res);
});

app.listen(3000);
```

## Connect to Agents

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

## LangGraph Integration

Use with LangGraph for enhanced agent capabilities:

```typescript
import { WardenClient } from "@wardenprotocol/agent-kit";

const client = new WardenClient({
  apiUrl: "http://localhost:8123",
  a2a: {
    url: "https://remote-agent.example.com",
  },
});

// LangGraph operations
const assistants = await client.assistants.search();
const thread = await client.threads.create();

for await (const event of client.runs.stream(thread.thread_id, assistants[0].assistant_id, {
  input: { messages: [{ role: "user", content: "Hello!" }] },
})) {
  console.log(event);
}

// A2A operations on the same client
const agentCard = await client.a2a.getAgentCard();
const response = await client.a2a.sendText("Hello!");
```

## Server Endpoints

When you create an agent server, these endpoints are automatically available:

| Endpoint | Description |
|----------|-------------|
| `GET /.well-known/agent-card.json` | Agent discovery - returns capabilities and metadata |
| `POST /` | JSON-RPC endpoint for all operations |

**Supported methods:**
- `message/send` - Send a message and get a response
- `message/stream` - Send a message and stream the response (SSE)
- `tasks/get` - Get task status by ID
- `tasks/cancel` - Cancel a running task
- `tasks/resubscribe` - Subscribe to task updates

## Type Definitions

Full TypeScript support with exported types:

```typescript
import type {
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
  }
}
```

## License

MIT
