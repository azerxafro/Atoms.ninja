#!/usr/bin/env node
/**
 * verify-ai.js — Verification script for Atoms Ninja AI
 * 1. Checks if providers are reachable
 * 2. Tests the multi-ai endpoint orchestration
 * 3. Validates Kali tool command generation
 */

require("dotenv").config();
const fetch = require("node-fetch");

const BACKEND_URL = "http://localhost:3001";

async function verifyAI() {
  console.log("🧪 Starting AI Verification...\n");

  // 1. Health Check
  try {
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`✓ Health Check: ${healthData.status} (AI: ${healthData.ai})`);
  } catch (e) {
    console.error("✗ Health Check failed. Is the server running? (npm start)");
    return;
  }

  // 2. Test General Conversation
  try {
    const chatRes = await fetch(`${BACKEND_URL}/api/multi-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello Atom, how is the security landscape today?",
      }),
    });
    const chatData = await chatRes.json();
    if (chatData.response) {
      console.log(
        `✓ AI Response Received (Provider: ${chatData.provider || "unknown"}, Model: ${chatData.model || "unknown"})`,
      );
      console.log(
        `  Response Preview: ${chatData.response.substring(0, 100)}...`,
      );
    } else {
      console.error(
        "✗ AI Request failed: No response content. Check API keys and balance.",
      );
    }
  } catch (e) {
    console.error(`✗ AI Request Error: ${e.message}`);
  }

  // 3. Test Action Mode Command Generation
  console.log("\n📡 Testing Action Mode (Command Generation)...");
  try {
    const taskRes = await fetch(`${BACKEND_URL}/api/multi-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "scan 127.0.0.1 for open ports" }),
    });
    const taskData = await taskRes.json();

    if (taskData.autoExecute) {
      console.log(`✓ Command Generated: ${taskData.autoExecute.command}`);
      console.log(`✓ Explanation: ${taskData.autoExecute.explanation}`);
    } else {
      console.log(
        "ℹ️ No command generated. This is expected if AI keys are missing or provider quota is zero.",
      );
    }
  } catch (e) {
    console.error(`✗ Action Mode Request Error: ${e.message}`);
  }

  console.log("\n✅ Verification script complete.");
}

verifyAI();
