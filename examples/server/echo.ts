/**
 * Echo Agent — minimal A2A server for testing
 *
 * No external dependencies required. Echoes back the user's message.
 * Useful for testing with the A2A Inspector or any A2A client.
 *
 * Usage:
 *   pnpm echo
 */

import {
  createA2AServer,
  type AgentCard,
  type TaskContext,
  type TaskYieldUpdate,
} from "@wardenprotocol/agent-kit";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";
const BASE_URL = `http://${HOST}:${PORT}`;

const agentCard: AgentCard = {
  name: "Echo Agent",
  description: "Echoes back your message. Useful for testing A2A connectivity.",
  version: "1.0.0",
  url: BASE_URL,
  capabilities: {
    streaming: true,
    pushNotifications: false,
  },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "echo",
      name: "Echo",
      description: "Echoes back the user's message",
      tags: ["echo", "test"],
    },
  ],
};

async function* handleTask(
  context: TaskContext,
): AsyncGenerator<TaskYieldUpdate> {
  const { message } = context;

  const textPart = message.parts.find((p) => {
    const part = p as unknown as Record<string, unknown>;
    return part.type === "text" || part.kind === "text";
  });
  const userText =
    ((textPart as unknown as Record<string, unknown>)?.text as string) || "";

  yield { state: "working" };

  yield {
    state: "completed",
    message: {
      role: "agent",
      parts: [{ type: "text", text: `Echo: ${userText}` }],
    },
  };
}

const server = createA2AServer({
  agentCard,
  handler: handleTask,
});

server.listen(PORT).then(() => {
  console.log(`Echo Agent running on ${BASE_URL}`);
  console.log(`Agent card: ${BASE_URL}/.well-known/agent-card.json`);
});
