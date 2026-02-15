/**
 * LangSmith A2A Client Test
 *
 * Tests the A2A client against a LangGraph agent deployed on LangSmith.
 * Exercises both message/send and message/stream.
 *
 * Usage:
 *   pnpm test-langsmith
 *
 * Environment:
 *   LANGSMITH_URL      - LangSmith A2A endpoint URL
 *   LANGSMITH_API_KEY  - LangSmith API key
 */

import "dotenv/config";
import {
  createA2AOnlyClient,
  type StreamEvent,
} from "@wardenprotocol/agent-kit";

const AGENT_URL = process.env.LANGSMITH_URL;
const API_KEY = process.env.LANGSMITH_API_KEY;

if (!AGENT_URL || !API_KEY) {
  console.error(
    "Set LANGSMITH_URL and LANGSMITH_API_KEY environment variables.\n" +
      "Example:\n" +
      "  LANGSMITH_URL=https://your-app.us.langgraph.app/a2a/your-assistant-id \\\n" +
      "  LANGSMITH_API_KEY=lsv2_pt_... \\\n" +
      "  pnpm test-langsmith",
  );
  process.exit(1);
}

async function main() {
  console.log("=== LangSmith A2A Client Test ===\n");
  console.log(`URL: ${AGENT_URL}\n`);

  // Step 1: Create a client
  // Note: LangSmith agents don't follow standard agent card discovery
  // (card is at host root with ?assistant_id= query param), so we skip discovery.
  console.log("1. Creating A2A client...");
  const client = createA2AOnlyClient({
    url: AGENT_URL,
    auth: {
      type: "apiKey",
      credentials: API_KEY,
      headerName: "x-api-key",
    },
  });
  console.log("   Client created!\n");

  // Step 2: Send a message (message/send)
  console.log("2. Sending message (message/send)...");
  const response = await client.sendText("What is 2 + 2?");
  console.log(`   Task ID: ${response.task?.id}`);
  console.log(`   State: ${response.task?.state}`);
  console.log(`   Context ID: ${response.task?.contextId}`);

  if (response.task?.messages) {
    const agentMsg = response.task.messages.find((m) => m.role === "agent");
    if (agentMsg) {
      const textPart = agentMsg.parts.find(
        (p) =>
          (p as unknown as Record<string, unknown>).type === "text" ||
          (p as unknown as Record<string, unknown>).kind === "text",
      );
      const text = (textPart as unknown as Record<string, unknown>)?.text;
      console.log(`   Response: "${text}"`);
    }
  }
  console.log();

  // Step 3: Stream a message (message/stream)
  console.log("3. Streaming message (message/stream)...");
  let eventCount = 0;
  let finalState = "";

  for await (const event of client.streamText(
    "Tell me a fun fact about space.",
  )) {
    eventCount++;
    const e = event as StreamEvent & Record<string, unknown>;

    if (e.type === "task_status_update") {
      console.log(`   Event ${eventCount}: status -> ${e.state}`);
      finalState = e.state as string;

      if (e.message) {
        const msg = e.message as { parts?: Array<Record<string, unknown>> };
        const textPart = msg.parts?.find(
          (p) => p.type === "text" || p.kind === "text",
        );
        if (textPart?.text) {
          const text = String(textPart.text);
          console.log(
            `   Message: "${text.length > 100 ? text.slice(0, 100) + "..." : text}"`,
          );
        }
      }
    } else if (e.type === "task_artifact_update") {
      console.log(`   Event ${eventCount}: artifact update`);
    } else {
      console.log(`   Event ${eventCount}: ${e.type || e.kind || "unknown"}`);
    }
  }

  console.log(`   Total events: ${eventCount}`);
  console.log(`   Final state: ${finalState}`);
  console.log();

  console.log("=== Test Complete ===\n");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
