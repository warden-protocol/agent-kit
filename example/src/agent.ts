/**
 * AgentKit Example - LLM-Powered Agent
 *
 * This demonstrates how to create an AI agent using the Warden AgentKit SDK
 * with OpenAI for LLM capabilities and full streaming support.
 */

import "dotenv/config";
import OpenAI from "openai";
import {
  createA2AServer,
  type AgentCard,
  type Message,
  type StreamEvent,
  type TaskStatusUpdateEvent,
} from "@wardenprotocol/agent-kit";

// =============================================================================
// Configuration
// =============================================================================

const PORT = process.env.PORT || 3000;
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
    "An AI assistant powered by OpenAI, built with the Warden AgentKit SDK",
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
// Message Handler
// =============================================================================

/**
 * Process incoming messages using OpenAI's API.
 * Supports streaming responses and multi-turn conversations.
 */
async function* handleMessage(message: Message): AsyncGenerator<StreamEvent> {
  // Extract text from the message
  const textPart = message.parts.find((p) => {
    const part = p as unknown as Record<string, unknown>;
    return part.type === "text" || part.kind === "text";
  });
  const userText =
    ((textPart as unknown as Record<string, unknown>)?.text as string) || "";

  if (!userText.trim()) {
    yield {
      type: "task_status_update",
      taskId: "",
      state: "completed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: "Please provide a message." }],
      },
      timestamp: new Date().toISOString(),
    } satisfies TaskStatusUpdateEvent;
    return;
  }

  // Get or create conversation history
  const contextId = message.contextId || "default";
  const history = getHistory(contextId);

  // Add user message to history
  history.push({ role: "user", content: userText });

  // Yield working status (used for streaming SSE responses to the client)
  yield {
    type: "task_status_update",
    taskId: "",
    state: "working",
    timestamp: new Date().toISOString(),
  } satisfies TaskStatusUpdateEvent;

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
      type: "task_status_update",
      taskId: "",
      state: "completed",
      message: {
        role: "agent",
        parts: [{ type: "text", text: fullResponse }],
      },
      timestamp: new Date().toISOString(),
    } satisfies TaskStatusUpdateEvent;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";

    // Check if it's an API key error
    if (errorMessage.includes("API key")) {
      yield {
        type: "task_status_update",
        taskId: "",
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
        timestamp: new Date().toISOString(),
      } satisfies TaskStatusUpdateEvent;
    } else {
      yield {
        type: "task_status_update",
        taskId: "",
        state: "failed",
        message: {
          role: "agent",
          parts: [{ type: "text", text: `Error: ${errorMessage}` }],
        },
        timestamp: new Date().toISOString(),
      } satisfies TaskStatusUpdateEvent;
    }
  }
}

// =============================================================================
// Create and Start Server
// =============================================================================

const server = createA2AServer({
  agentCard: AGENT_CARD,
  handleMessage,
});

server.listen(Number(PORT)).then(() => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  console.log("AgentKit Example Agent");
  console.log(`Server: ${BASE_URL}`);
  console.log(`Agent Card: ${BASE_URL}/.well-known/agent-card.json`);
  console.log(`Model: ${model}`);
  console.log(`API Key: ${hasApiKey ? "configured" : "NOT SET"}`);

  if (!hasApiKey) {
    console.log(
      "\nWarning: OPENAI_API_KEY not set. Copy .env.example to .env and configure it.",
    );
  }
});
