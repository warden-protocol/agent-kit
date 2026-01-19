/**
 * AgentKit Example - Dual Protocol Agent
 *
 * This demonstrates how to create an AI agent using the Warden AgentKit SDK
 * with OpenAI for LLM capabilities and full streaming support.
 *
 * The agent supports both A2A and LangGraph protocols simultaneously,
 * allowing clients to connect via either:
 * - A2A: POST / (JSON-RPC), GET /.well-known/agent-card.json
 * - LangGraph: /assistants, /threads, /runs, /info
 */

import "dotenv/config";
import OpenAI from "openai";
import {
  AgentServer,
  type AgentCard,
  type TaskContext,
  type TaskYieldUpdate,
} from "@wardenprotocol/agent-kit";

// =============================================================================
// Configuration
// =============================================================================

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";
const BASE_URL = `http://${HOST}:${PORT}`;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise and friendly in your responses.`;

const AGENT_CARD: AgentCard = {
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
  protocols: [
    {
      type: "jsonrpc",
      url: BASE_URL,
    },
  ],
  a2aVersion: "1.0",
};

// =============================================================================
// Conversation History (in-memory for demo purposes)
// =============================================================================

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

// =============================================================================
// Task Handler
// =============================================================================

/**
 * Process incoming messages using OpenAI's API.
 * Supports streaming responses and multi-turn conversations.
 *
 * The handler receives a TaskContext and yields TaskYieldUpdate objects.
 * This is the recommended API for building agents.
 */
async function* handleTask(
  context: TaskContext,
): AsyncGenerator<TaskYieldUpdate> {
  const { message } = context;

  // Extract text from the message
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

  // Get or create conversation history
  const contextId = message.contextId || "default";
  const history = getHistory(contextId);

  // Add user message to history
  history.push({ role: "user", content: userText });

  // Yield working status
  yield { state: "working" };

  try {
    // Call OpenAI API with streaming
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

    // Collect the full response
    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
    }

    // Add assistant response to history
    history.push({ role: "assistant", content: fullResponse });

    // Keep history manageable (last 20 messages)
    while (history.length > 20) {
      history.shift();
    }

    // Yield completed status with response
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

    // Check if it's an API key error
    if (errorMessage.includes("API key")) {
      yield {
        state: "failed",
        message: {
          role: "agent",
          parts: [
            {
              type: "text",
              text: "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
            },
          ],
        },
      };
    } else {
      yield {
        state: "failed",
        message: {
          role: "agent",
          parts: [{ type: "text", text: `Error: ${errorMessage}` }],
        },
      };
    }
  }
}

// =============================================================================
// Create and Start Server
// =============================================================================

const server = new AgentServer({
  agentCard: AGENT_CARD,
  handler: handleTask,
});

server.listen(PORT).then(() => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  console.log("AgentKit Example Agent (Dual Protocol)");
  console.log("======================================");
  console.log(`Server: ${BASE_URL}`);
  console.log(`Model: ${model}`);
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
  console.log(`  Runs:       ${BASE_URL}/runs`);

  if (!hasApiKey) {
    console.log("");
    console.log(
      "Warning: OPENAI_API_KEY not set. Copy .env.example to .env and configure it.",
    );
  }
});
