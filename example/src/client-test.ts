/**
 * Warden SDK Demo - Client Test
 *
 * Run this after starting the agent server (pnpm agent) to test the A2A client.
 */

import { createA2AOnlyClient, discoverAgent } from "@warden-protocol/agentkit";

const AGENT_URL = "http://localhost:3000";

async function main() {
  console.log("=== Warden SDK Client Test ===\n");

  // Step 1: Discover the agent
  console.log("1. Discovering agent...");
  const agentCard = await discoverAgent(AGENT_URL);
  console.log(`   Name: ${agentCard.name}`);
  console.log(`   Description: ${agentCard.description}`);
  console.log(`   Skills: ${agentCard.skills?.map((s) => s.id).join(", ")}`);
  console.log();

  // Step 2: Create a client
  console.log("2. Creating A2A client...");
  const client = createA2AOnlyClient({ url: AGENT_URL });
  console.log("   Client created!\n");

  // Step 3: Send a simple text message
  console.log("3. Sending text message...");
  const response1 = await client.sendText("Hello, Demo Agent!");
  console.log(`   Task ID: ${response1.task?.id}`);
  console.log(`   State: ${response1.task?.state}`);
  console.log();

  // Step 4: Wait for task completion
  if (response1.task) {
    console.log("4. Waiting for task completion...");
    const completedTask = await client.waitForTask(response1.task.id, {
      pollInterval: 200,
      timeout: 5000,
    });
    console.log(`   Final state: ${completedTask.state}`);

    const agentResponse = completedTask.messages?.find(
      (m) => m.role === "agent",
    );
    if (agentResponse) {
      const textPart = agentResponse.parts.find((p) => p.type === "text");
      if (textPart?.type === "text") {
        console.log(`   Agent response: "${textPart.text}"`);
      }
    }
    console.log();
  }

  // Step 5: Test the reverse skill
  console.log("5. Testing 'reverse' skill...");
  const response2 = await client.sendMessage({
    message: {
      role: "user",
      parts: [{ type: "text", text: "Hello World" }],
      metadata: { skill: "reverse" },
    },
  });

  if (response2.task) {
    const reversedTask = await client.waitForTask(response2.task.id, {
      pollInterval: 200,
    });
    const agentResponse = reversedTask.messages?.find(
      (m) => m.role === "agent",
    );
    if (agentResponse) {
      const textPart = agentResponse.parts.find((p) => p.type === "text");
      if (textPart?.type === "text") {
        console.log(`   Input: "Hello World"`);
        console.log(`   Output: "${textPart.text}"`);
      }
    }
  }
  console.log();

  // Step 6: Test the uppercase skill
  console.log("6. Testing 'uppercase' skill...");
  const response3 = await client.sendMessage({
    message: {
      role: "user",
      parts: [{ type: "text", text: "make me loud" }],
      metadata: { skill: "uppercase" },
    },
  });

  if (response3.task) {
    const uppercaseTask = await client.waitForTask(response3.task.id, {
      pollInterval: 200,
    });
    const agentResponse = uppercaseTask.messages?.find(
      (m) => m.role === "agent",
    );
    if (agentResponse) {
      const textPart = agentResponse.parts.find((p) => p.type === "text");
      if (textPart?.type === "text") {
        console.log(`   Input: "make me loud"`);
        console.log(`   Output: "${textPart.text}"`);
      }
    }
  }
  console.log();

  // Step 7: List all tasks
  console.log("7. Listing all tasks...");
  const { tasks } = await client.listTasks();
  console.log(`   Total tasks: ${tasks.length}`);
  for (const task of tasks) {
    console.log(`   - ${task.id}: ${task.state}`);
  }
  console.log();

  console.log("=== Test Complete ===\n");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
