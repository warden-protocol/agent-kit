/**
 * Agent Server
 *
 * A server that exposes both A2A and LangGraph APIs simultaneously,
 * allowing agents to be consumed by both A2A clients and LangGraph SDK clients.
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server,
} from "http";
import { A2AServer, type A2AServerConfig } from "../a2a/server.js";
import { LangGraphServer, type LangGraphServerConfig } from "./server.js";
import type { AgentCard } from "../a2a/types.js";
import type { TaskHandler } from "../a2a/server.js";

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration for the agent server.
 */
export interface AgentServerConfig {
  /** The agent card describing this agent */
  agentCard: AgentCard;

  /** Task handler function */
  handler: TaskHandler;

  /** Enable CORS headers (default: true) */
  cors?: boolean;

  /**
   * A2A-specific configuration overrides.
   * The agentCard and handler are inherited from the parent config.
   */
  a2a?: Omit<Partial<A2AServerConfig>, "agentCard" | "handler">;

  /**
   * LangGraph-specific configuration overrides.
   * The agentCard and handler are inherited from the parent config.
   */
  langgraph?: Omit<Partial<LangGraphServerConfig>, "agentCard" | "handler">;
}

// =============================================================================
// Agent Server
// =============================================================================

/**
 * Agent Server.
 *
 * Exposes both A2A and LangGraph APIs on the same server, allowing agents
 * to be consumed by both A2A clients and LangGraph SDK clients.
 *
 * **Routing:**
 * - A2A endpoints: `/.well-known/agent-card.json`, `POST /` (JSON-RPC)
 * - LangGraph endpoints: `/assistants/*`, `/threads/*`, `/runs/*`, `/info`, `/ok`
 *
 * @example
 * ```typescript
 * import { AgentServer } from "@wardenprotocol/agent-kit";
 *
 * const server = new AgentServer({
 *   agentCard: {
 *     name: "My Agent",
 *     description: "A helpful assistant",
 *     url: "http://localhost:3000",
 *     capabilities: { streaming: true, multiTurn: true },
 *   },
 *   handler: async function* (context) {
 *     const userMessage = context.message.parts
 *       .filter((p) => p.type === "text")
 *       .map((p) => p.text)
 *       .join("\n");
 *
 *     yield {
 *       state: "completed",
 *       message: {
 *         role: "agent",
 *         parts: [{ type: "text", text: `Echo: ${userMessage}` }]
 *       }
 *     };
 *   }
 * });
 *
 * await server.listen(3000);
 * console.log("Agent server running on http://localhost:3000");
 * console.log("- A2A: POST / (JSON-RPC), GET /.well-known/agent-card.json");
 * console.log("- LangGraph: /assistants, /threads, /runs, /info");
 * ```
 */
export class AgentServer {
  private readonly a2aServer: A2AServer;
  private readonly langGraphServer: LangGraphServer;
  private readonly config: AgentServerConfig;
  private server: Server | null = null;

  constructor(config: AgentServerConfig) {
    if (!config.handler) {
      throw new Error("AgentServerConfig must provide a 'handler'");
    }

    this.config = {
      ...config,
      cors: config.cors ?? true,
    };

    // Create A2A server (doesn't start listening)
    this.a2aServer = new A2AServer({
      agentCard: config.agentCard,
      handler: config.handler,
      cors: config.cors,
      ...config.a2a,
    });

    // Create LangGraph server (doesn't start listening)
    this.langGraphServer = new LangGraphServer({
      agentCard: config.agentCard,
      handler: config.handler,
      cors: config.cors,
      ...config.langgraph,
    });
  }

  /**
   * Start the server listening on the specified port.
   */
  listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch((error) => {
          console.error("Request error:", error);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
      });

      this.server.listen(port, () => {
        resolve();
      });
    });
  }

  /**
   * Gracefully close the server.
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get the underlying A2A server instance.
   */
  getA2AServer(): A2AServer {
    return this.a2aServer;
  }

  /**
   * Get the underlying LangGraph server instance.
   */
  getLangGraphServer(): LangGraphServer {
    return this.langGraphServer;
  }

  /**
   * Get the current agent card.
   */
  getAgentCard(): AgentCard {
    return this.a2aServer.getAgentCard();
  }

  /**
   * Update the agent card.
   */
  updateAgentCard(
    update: Partial<AgentCard> | ((current: AgentCard) => AgentCard),
  ): AgentCard {
    return this.a2aServer.updateAgentCard(update);
  }

  /**
   * Main request handler - routes to appropriate protocol handler.
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method || "GET";

    // Determine which protocol to use based on the path

    // A2A endpoints
    if (
      path === "/.well-known/agent-card.json" ||
      path === "/.well-known/agent-card"
    ) {
      return this.a2aServer.getHandler()(req, res);
    }

    // Root POST is A2A JSON-RPC (check content type or method)
    if (path === "/" && method === "POST") {
      // Check if it looks like JSON-RPC (has jsonrpc field)
      // For simplicity, route all POST / to A2A
      return this.a2aServer.getHandler()(req, res);
    }

    // LangGraph endpoints
    if (
      path === "/info" ||
      path === "/ok" ||
      path.startsWith("/assistants") ||
      path.startsWith("/threads") ||
      path.startsWith("/runs") ||
      path.startsWith("/store")
    ) {
      return this.langGraphServer.getHandler()(req, res);
    }

    // Handle OPTIONS for CORS
    if (method === "OPTIONS") {
      if (this.config.cors) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Api-Key, A2A-Version, Accept",
        );
      }
      res.writeHead(204);
      res.end();
      return;
    }

    // Default: 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
}

// =============================================================================
// Backwards Compatibility Aliases
// =============================================================================

/** @deprecated Use AgentServer instead */
export const DualProtocolServer = AgentServer;
/** @deprecated Use AgentServerConfig instead */
export type DualProtocolServerConfig = AgentServerConfig;

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new agent server.
 *
 * @param config - Server configuration
 * @returns A configured agent server
 *
 * @example
 * ```typescript
 * const server = createAgentServer({
 *   agentCard: {
 *     name: "My Agent",
 *     url: "http://localhost:3000",
 *   },
 *   handler: async function* (context) {
 *     yield {
 *       state: "completed",
 *       message: { role: "agent", parts: [{ type: "text", text: "Hello!" }] }
 *     };
 *   }
 * });
 *
 * await server.listen(3000);
 * ```
 */
export function createAgentServer(config: AgentServerConfig): AgentServer {
  return new AgentServer(config);
}

/** @deprecated Use createAgentServer instead */
export const createDualProtocolServer = createAgentServer;
