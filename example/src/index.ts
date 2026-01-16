/**
 * Warden SDK Demo - Basic Usage
 *
 * This demonstrates how to use the Warden SDK as a client
 * to interact with LangGraph and A2A agents.
 */

import {
  WardenClient,
  createClient,
  discoverAgent,
} from "@wardenprotocol/agent-kit";

async function main() {
  console.log("=== Warden SDK Demo ===\n");

  // Example 1: Create a client for LangGraph
  console.log("1. Creating Warden client...");
  const client = createClient({
    apiUrl: "http://localhost:8123",
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

  // Example 4: Discover a remote agent (would need a real URL)
  console.log("4. Agent Discovery example:");
  console.log(`
   const agentCard = await discoverAgent("https://agent.example.com");
   console.log("Agent name:", agentCard.name);
   console.log("Capabilities:", agentCard.capabilities);
   console.log("Skills:", agentCard.skills);
  `);

  // Example 5: Send a message to an A2A agent
  console.log("5. Sending messages:");
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

  // Example 6: Streaming
  console.log("6. Streaming responses:");
  console.log(`
   for await (const event of client.a2a.streamText("Tell me a story")) {
     if (event.type === "task_status_update") {
       console.log("Status:", event.state);
     }
   }
  `);

  // Example 7: Conversation with context
  console.log("7. Multi-turn conversation:");
  console.log(`
   const task1 = await client.a2a.converse("What's 2+2?", {
     contextId: "math-session",
   });

   const task2 = await client.a2a.converse("Now multiply that by 3", {
     contextId: "math-session",
   });
  `);

  console.log("\n=== Demo Complete ===");
  console.log("Run 'pnpm agent' to start a sample A2A agent server.\n");
}

main().catch(console.error);
