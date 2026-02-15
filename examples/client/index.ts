/**
 * Warden SDK Demo - Basic Usage
 *
 * This demonstrates how to use the Warden SDK as a client
 * to interact with LangGraph and A2A agents.
 */

import { createClient, discoverAgent } from "@wardenprotocol/agent-kit";

async function main() {
  console.log("=== Warden SDK Demo ===\n");

  // Example 1: Create a client for LangGraph
  console.log("1. Creating Warden client...");
  const client = createClient({
    apiUrl: "http://localhost:3000",
  });
  console.log("   Client created successfully!\n");

  // Example 2: Using LangGraph SDK features
  console.log("2. LangGraph SDK features:");
  console.log("   - client.assistants.search()");
  console.log("   - client.threads.create()");
  console.log("   - client.runs.stream()");
  console.log("   - client.store.putItem()\n");

  // Example 3: A2A Protocol features
  console.log("3. A2A Protocol features:");
  console.log("   - client.a2a.getAgentCard()");
  console.log("   - client.a2a.sendMessage()");
  console.log("   - client.a2a.sendStreamingMessage()");
  console.log("   - client.a2a.getTask()");
  console.log("   - client.a2a.cancelTask()\n");

  // Example 4: Discover a remote agent
  console.log("4. Agent Discovery example:");
  console.log(`
   const agentCard = await discoverAgent("https://agent.example.com");
   console.log("Agent name:", agentCard.name);
   console.log("Capabilities:", agentCard.capabilities);
   console.log("Skills:", agentCard.skills);
  `);

  // Example 5: Send a message to an A2A agent
  console.log("5. Sending messages via A2A:");
  console.log(`
   // Simple text message
   const response = await client.a2a.sendText("Hello, agent!");

   // Full message with multiple parts
   const response2 = await client.a2a.sendMessage({
     message: {
       role: "user",
       parts: [
         { type: "text", text: "Analyze this data" },
         { type: "data", data: { values: [1, 2, 3] } },
       ],
     },
   });
  `);

  // Example 6: Streaming via A2A
  console.log("6. Streaming responses via A2A:");
  console.log(`
   for await (const event of client.a2a.streamText("Tell me a story")) {
     if (event.type === "task_status_update") {
       console.log("Status:", event.state);
     }
   }
  `);

  // Example 7: LangGraph SDK usage
  console.log("7. LangGraph SDK usage:");
  console.log(`
   // Create a thread
   const thread = await client.threads.create();
   console.log("Thread ID:", thread.thread_id);

   // List assistants
   const assistants = await client.assistants.search();
   console.log("Available assistants:", assistants);

   // Run a completion with streaming
   const stream = client.runs.stream(
     thread.thread_id,
     "assistant-id",
     {
       input: { messages: [{ role: "user", content: "Hello!" }] },
       streamMode: "messages",
     }
   );

   for await (const event of stream) {
     console.log("Event:", event);
   }
  `);

  // Example 8: Multi-turn conversation via A2A
  console.log("8. Multi-turn conversation via A2A:");
  console.log(`
   const task1 = await client.a2a.converse("What's 2+2?", {
     contextId: "math-session",
   });

   const task2 = await client.a2a.converse("Now multiply that by 3", {
     contextId: "math-session",
   });
  `);

  // Example 9: Multi-turn conversation via LangGraph
  console.log("9. Multi-turn conversation via LangGraph:");
  console.log(`
   // Create a thread for the conversation
   const thread = await client.threads.create();

   // First turn
   await client.runs.wait(thread.thread_id, "assistant-id", {
     input: { messages: [{ role: "user", content: "What's 2+2?" }] },
   });

   // Second turn (same thread maintains context)
   await client.runs.wait(thread.thread_id, "assistant-id", {
     input: { messages: [{ role: "user", content: "Now multiply that by 3" }] },
   });
  `);

  console.log("\n=== Demo Complete ===");
  console.log(
    "Run 'pnpm agent' to start a sample dual-protocol agent server.\n",
  );
  console.log("The agent will be accessible via both:");
  console.log("  - A2A: POST / (JSON-RPC), GET /.well-known/agent-card.json");
  console.log("  - LangGraph: /assistants, /threads, /runs, /info\n");
}

main().catch(console.error);
