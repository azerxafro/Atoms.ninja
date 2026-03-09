/**
 * Beta API - Self-Training Lab System
 * Handles MCP server requests, lab sandbox, and training sessions
 */

let labSandbox;
let mcpServers;
let selfTrainer;

try {
  labSandbox = require("../lib/lab-sandbox");
  mcpServers = require("../lib/mcp-servers");
  selfTrainer = require("../lib/self-trainer");
} catch (e) {
  console.error("Failed to load modules:", e.message);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

async function handleMCPRequest(req, res) {
  const { server, action, params } = req.body || {};

  if (!server) {
    return res.status(400).json({ error: "Server parameter required" });
  }

  try {
    if (action === "list") {
      const servers = mcpServers.getEnabledServers();
      return res.json({ servers });
    }

    if (action === "status") {
      const status = mcpServers.getStatus();
      return res.json({ status });
    }

    // Execute MCP request
    const result = await mcpServers.executeRequest(server, params || {});
    return res.json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleLabRequest(req, res) {
  const { action } = req.body || {};

  try {
    switch (action) {
      case "create": {
        const { config } = req.body;
        const instance = await labSandbox.createInstance(config);
        return res.json({
          success: true,
          instanceId: instance.id,
          status: instance.status,
        });
      }

      case "list": {
        const instances = await labSandbox.listInstances();
        return res.json({ instances });
      }

      case "status": {
        const status = labSandbox.getStatus();
        return res.json({ status });
      }

      case "execute": {
        const { script, params, config } = req.body;
        if (!script) {
          return res.status(400).json({ error: "Script name required" });
        }

        const result = await labSandbox.executeOnSandbox(
          script,
          params || {},
          config || {},
        );
        return res.json({ success: true, result });
      }

      case "cleanup": {
        await labSandbox.cleanupAll();
        return res.json({ success: true, message: "All instances cleaned up" });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleTrainingRequest(req, res) {
  const { action } = req.body || {};

  try {
    switch (action) {
      case "start": {
        const { config } = req.body;
        const report = await selfTrainer.startTrainingSession(config || {});
        return res.json({ success: true, report });
      }

      case "status": {
        const status = await selfTrainer.getStatus();
        return res.json({ status });
      }

      case "scripts": {
        const scripts = selfTrainer.getScripts();
        return res.json({ scripts });
      }

      case "improve": {
        const { scriptName, feedback } = req.body;
        if (!scriptName || !feedback) {
          return res
            .status(400)
            .json({ error: "scriptName and feedback required" });
        }

        const improved = await selfTrainer.improveScript(scriptName, feedback);
        return res.json({ success: true, script: improved });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).set(corsHeaders).send("");
  }

  const path = req.url || "";

  // Route based on path
  try {
    if (path.startsWith("/mcp")) {
      return await handleMCPRequest(req, res);
    }

    if (path.startsWith("/lab")) {
      return await handleLabRequest(req, res);
    }

    if (path.startsWith("/train")) {
      return await handleTrainingRequest(req, res);
    }

    // Default - return API info
    return res.json({
      name: "Beta API - Self-Training Lab",
      version: "1.0.0",
      endpoints: {
        "/mcp": "MCP Server management",
        "/lab": "Lab Sandbox management",
        "/train": "Training session management",
      },
    });
  } catch (error) {
    console.error("Beta API Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
