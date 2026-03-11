#!/usr/bin/env node
/**
 * Comprehensive Test Suite for API Key and MCP Server
 * Tests that both the AI API and Kali MCP server are working
 * and can handle user-provided tasks
 */

require("dotenv").config();
const http = require("http");
const https = require("https");
const fetch = require("node-fetch");

// Test Configuration
const BACKEND_PORT = process.env.PORT || 3001;
const KALI_PORT = process.env.PORT || 3001;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Validate AI Configuration
async function testAIConfiguration() {
  log("\n📋 Test 1: AI Provider Configuration", "cyan");

  const hasVenice = !!process.env.VENICE_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  if (!hasVenice && !hasOpenRouter) {
    log("✗ FAILED: No AI provider keys found (VENICE or OPENROUTER)", "red");
    return false;
  }

  log(
    `✓ AI Providers found: ${hasVenice ? "Venice " : ""}${hasOpenRouter ? "OpenRouter" : ""}`,
    "green",
  );
  return true;
}

// Test 2: Test Multi-AI Endpoint Access
async function testMultiAIAccess() {
  log("\n🤖 Test 2: Multi-AI Logic Access", "cyan");

  try {
    const response = await fetch(
      `http://localhost:${BACKEND_PORT}/api/multi-ai`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello, are you real?" }),
      },
    );

    if (!response.ok) {
      log(`✗ FAILED: Multi-AI returned ${response.status}`, "red");
      return false;
    }

    const data = await response.json();
    if (data.response) {
      log(`✓ Multi-AI responds: ${data.response.substring(0, 100)}`, "green");
      return true;
    } else {
      log("✗ FAILED: No response content", "red");
      return false;
    }
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, "red");
    return false;
  }
}

// Test 3: Test Backend Proxy Health
async function testBackendHealth() {
  log("\n🏥 Test 3: Backend Proxy Health Check", "cyan");

  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            log(`✓ Backend is healthy: ${json.service}`, "green");
            resolve(true);
          } catch (e) {
            log("✗ FAILED: Invalid JSON response", "red");
            resolve(false);
          }
        } else {
          log(`✗ FAILED: Backend returned ${res.statusCode}`, "red");
          resolve(false);
        }
      });
    });

    req.on("error", (err) => {
      log(`✗ FAILED: Backend not reachable - ${err.message}`, "red");
      log("  Make sure to start the backend with: npm start", "yellow");
      resolve(false);
    });
  });
}

// Test 4: Test OpenRouter Proxy
async function testOpenRouterProxy() {
  log("\n🔄 Test 4: OpenRouter Proxy", "cyan");

  try {
    const response = await fetch(
      `http://localhost:${BACKEND_PORT}/api/openrouter`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: 'Respond with "Verified" and nothing else.',
        }),
      },
    );

    if (response.statusCode === 200) {
      const json = await response.json();
      if (json.response) {
        log(`✓ Proxy working: ${json.response}`, "green");
        return true;
      }
    }
    log(`✗ FAILED: Status ${response.status}`, "red");
    return false;
  } catch (e) {
    log(`✗ FAILED: ${e.message}`, "red");
    return false;
  }
}

// Test 5: Test MCP Server Health
async function testMcpServerHealth() {
  log("\n🛡️  Test 5: MCP Server Health Check", "cyan");

  try {
    const response = await fetch(`http://localhost:${KALI_PORT}/health`);
    if (response.ok) {
      const json = await response.json();
      log(`✓ MCP Server is healthy: ${json.service}`, "green");
      return true;
    }
    log(`✗ FAILED: status ${response.status}`, "red");
    return false;
  } catch (err) {
    log(`✗ FAILED: ${err.message}`, "red");
    return false;
  }
}

// Test 6: Test MCP Tools List
async function testMcpToolsList() {
  log("\n🔧 Test 6: MCP Tools Availability", "cyan");

  return new Promise((resolve) => {
    const req = http.get(
      `http://localhost:${KALI_MCP_PORT}/api/tools`,
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              if (json.categories) {
                log(`✓ MCP Tools available:`, "green");
                Object.keys(json.categories).forEach((category) => {
                  log(
                    `  - ${category}: ${json.categories[category].length} tools`,
                    "green",
                  );
                });
                resolve(true);
              } else {
                log("✗ FAILED: No categories in response", "red");
                resolve(false);
              }
            } catch (e) {
              log(`✗ FAILED: Invalid JSON - ${e.message}`, "red");
              resolve(false);
            }
          } else {
            log(
              `✗ FAILED: MCP tools endpoint returned ${res.statusCode}`,
              "red",
            );
            resolve(false);
          }
        });
      },
    );

    req.on("error", (err) => {
      log(`✗ FAILED: ${err.message}`, "red");
      resolve(false);
    });
  });
}

// Test 7: Test User Task Execution
async function testUserTaskExecution() {
  log("\n👤 Test 7: User Task Execution", "cyan");

  try {
    const response = await fetch(
      `http://localhost:${BACKEND_PORT}/api/multi-ai`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Explain nmap in 1 sentence." }),
      },
    );

    if (response.ok) {
      const json = await response.json();
      if (json.response) {
        log(`✓ User task executed successfully`, "green");
        log(`  AI Response: ${json.response.substring(0, 150)}...`, "blue");
        return true;
      }
    }
    log(`✗ FAILED`, "red");
    return false;
  } catch (e) {
    log(`✗ FAILED: ${e.message}`, "red");
    return false;
  }
}

// Test 8: Test MCP Command Execution (Safe command)
async function testMcpCommandExecution() {
  log("\n⚡ Test 8: MCP Command Execution", "cyan");

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      command: "whois",
      args: ["example.com"],
    });

    const options = {
      hostname: "localhost",
      port: KALI_MCP_PORT,
      path: "/api/execute",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.result || json.stderr) {
              log(`✓ MCP command executed successfully`, "green");
              log(
                `  Result preview: ${(json.result || json.stderr).substring(0, 100)}...`,
                "blue",
              );
              resolve(true);
            } else {
              log("✗ FAILED: No result from command", "red");
              resolve(false);
            }
          } catch (e) {
            log(`✗ FAILED: ${e.message}`, "red");
            resolve(false);
          }
        } else {
          log(`✗ FAILED: Command execution returned ${res.statusCode}`, "red");
          log(`Response: ${data}`, "red");
          resolve(false);
        }
      });
    });

    req.on("error", (err) => {
      log(`✗ FAILED: ${err.message}`, "red");
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Main test runner
async function runAllTests() {
  log("\n" + "=".repeat(60), "cyan");
  log("🧪 Atoms Ninja - Comprehensive API & MCP Test Suite", "cyan");
  log("=".repeat(60), "cyan");

  const results = [];

  // Run tests sequentially
  results.push({
    name: "AI Provider Configuration",
    passed: await testAIConfiguration(),
  });
  results.push({
    name: "Multi-AI Logic Access",
    passed: await testMultiAIAccess(),
  });
  results.push({
    name: "Backend Health Check",
    passed: await testBackendHealth(),
  });
  results.push({
    name: "OpenRouter Proxy",
    passed: await testOpenRouterProxy(),
  });
  results.push({
    name: "MCP Server Health",
    passed: await testMcpServerHealth(),
  });
  results.push({ name: "MCP Tools List", passed: await testMcpToolsList() });
  results.push({
    name: "User Task Execution",
    passed: await testUserTaskExecution(),
  });
  results.push({
    name: "MCP Command Execution",
    passed: await testMcpCommandExecution(),
  });

  // Summary
  log("\n" + "=".repeat(60), "cyan");
  log("📊 Test Results Summary", "cyan");
  log("=".repeat(60), "cyan");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? "✓" : "✗";
    const color = result.passed ? "green" : "red";
    log(`${icon} ${result.name}`, color);
  });

  log("\n" + "-".repeat(60), "cyan");
  log(
    `Total: ${passed}/${total} tests passed`,
    passed === total ? "green" : "yellow",
  );
  log("-".repeat(60) + "\n", "cyan");

  if (passed === total) {
    log("🎉 All tests passed! System is fully operational.", "green");
    process.exit(0);
  } else {
    log("⚠️  Some tests failed. Please check the output above.", "yellow");
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((err) => {
  log(`\n❌ Test suite error: ${err.message}`, "red");
  process.exit(1);
});
