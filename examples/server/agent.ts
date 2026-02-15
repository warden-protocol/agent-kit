/**
 * OpenAI Agent — dual-protocol server (A2A + LangGraph)
 *
 * An LLM-powered AI agent using OpenAI. Supports both A2A and LangGraph
 * protocols simultaneously on the same port.
 *
 * Requires OPENAI_API_KEY in .env or environment.
 *
 * Usage:
 *   pnpm agent
 */

import "dotenv/config";
import OpenAI from "openai";
import {
  AgentServer,
  type AgentCard,
  type TaskContext,
  type TaskYieldUpdate,
} from "@wardenprotocol/agent-kit";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";
const BASE_URL = `http://${HOST}:${PORT}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise and friendly in your responses.`;

const agentCard: AgentCard = {
  name: "AgentKit Example",
  description:
    "An AI assistant powered by OpenAI, built with the Warden AgentKit SDK. Supports both A2A and LangGraph protocols.",
  version: "1.0.0",
  url: BASE_URL,
  provider: {
    name: "AgentKit Example",
    organization: "Warden Protocol",
    url: "https://github.com/warden-protocol/agent-kit",
  },
  capabilities: {
    streaming: true,
    pushNotifications: false,
    multiTurn: true,
  },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "chat",
      name: "Chat",
      description: "Have a conversation with the AI assistant",
      tags: ["chat", "ai"],
    },
  ],
};

// In-memory conversation history (demo purposes)
const conversationHistory = new Map<
  string,
  Array<{ role: "user" | "assistant"; content: string }>
>();

function getHistory(
  contextId: string,
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!conversationHistory.has(contextId)) {
    conversationHistory.set(contextId, []);
  }
  return conversationHistory.get(contextId)!;
}

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

  if (!userText.trim()) {
    yield {
      state: "completed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: "Please provide a message." }],
      },
    };
    return;
  }

  const contextId = message.contextId || "default";
  const history = getHistory(contextId);
  history.push({ role: "user", content: userText });

  yield { state: "working" };

  try {
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ],
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
    }

    history.push({ role: "assistant", content: fullResponse });

    // Keep history manageable
    while (history.length > 20) {
      history.shift();
    }

    yield {
      state: "completed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: fullResponse }],
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";

    yield {
      state: "failed",
      message: {
        role: "agent",
        parts: [
          {
            type: "text",
            text: errorMessage.includes("API key")
              ? "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
              : `Error: ${errorMessage}`,
          },
        ],
      },
    };
  }
}

const server = new AgentServer({
  agentCard,
  handler: handleTask,
});

server.listen(PORT).then(() => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  console.log("AgentKit Example Agent (Dual Protocol)");
  console.log("======================================");
  console.log(`Server: ${BASE_URL}`);
  console.log(`Model:  ${model}`);
  console.log(`API Key: ${hasApiKey ? "configured" : "NOT SET"}`);
  console.log("");
  console.log("A2A Protocol:");
  console.log(`  Agent Card: ${BASE_URL}/.well-known/agent-card.json`);
  console.log(`  JSON-RPC:   POST ${BASE_URL}/`);
  console.log("");
  console.log("LangGraph Protocol:");
  console.log(`  Info:       ${BASE_URL}/info`);
  console.log(`  Assistants: ${BASE_URL}/assistants`);
  console.log(`  Threads:    ${BASE_URL}/threads`);

  if (!hasApiKey) {
    console.log("");
    console.log(
      "Warning: OPENAI_API_KEY not set. Copy .env.example to .env and configure it.",
    );
  }
});
