#!/usr/bin/env node
/**
 * API Key and MCP Server Validation Script
 * Validates that the API key is configured and the MCP server setup is correct
 * Tests the system's ability to handle user-provided tasks
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filepath, description) {
  if (fs.existsSync(filepath)) {
    log(`✓ ${description} exists: ${filepath}`, "green");
    return true;
  } else {
    log(`✗ ${description} not found: ${filepath}`, "red");
    return false;
  }
}

function validateApiKey() {
  log("\n📋 Validating API Key Configuration...", "cyan");

  let score = 0;
  let total = 0;

  // Check .env file
  total++;
  if (checkFile(".env.example", ".env.example file")) {
    score++;
    try {
      const envContent = fs.readFileSync(".env.example", "utf8");
      if (envContent.includes("GEMINI_API_KEY")) {
        log("  ✓ GEMINI_API_KEY defined in .env.example", "green");
      }
    } catch (e) {
      log(`  ⚠️  Could not read .env.example: ${e.message}`, "yellow");
    }
  }

  // Check environment variable or config.js
  total++;
  let apiKey = process.env.GEMINI_API_KEY;

  // If not in env, check config.js
  if (!apiKey && fs.existsSync("config.js")) {
    try {
      const configContent = fs.readFileSync("config.js", "utf8");
      const match = configContent.match(/GEMINI_API_KEY:\s*['"]([^'"]+)['"]/);
      if (match) {
        apiKey = match[1];
      }
    } catch (e) {
      // Ignore error
    }
  }

  if (apiKey) {
    log(
      `✓ API Key found in environment: ${apiKey.substring(0, 10)}...`,
      "green",
    );
    score++;

    // Validate format (basic check)
    if (apiKey.length >= 30) {
      log("  ✓ API Key length looks valid", "green");
    } else {
      log("  ⚠️  API Key seems too short", "yellow");
    }
  } else {
    log("✗ No API Key found in environment", "red");
  }

  // Check config.js
  total++;
  if (checkFile("config.js", "config.js file")) {
    score++;
    try {
      const configContent = fs.readFileSync("config.js", "utf8");
      if (configContent.includes("GEMINI_API_KEY")) {
        log("  ✓ GEMINI_API_KEY defined in config.js", "green");
      }
    } catch (e) {
      log(`  ⚠️  Could not read config.js: ${e.message}`, "yellow");
    }
  }

  // Check atoms-server.js (replaces gemini-proxy.js)
  total++;
  if (checkFile("atoms-server.js", "Backend server (atoms-server.js)")) {
    score++;
    try {
      const serverContent = fs.readFileSync("atoms-server.js", "utf8");
      if (serverContent.includes("OPENROUTER_API_KEY")) {
        log("  ✓ Backend configured for OpenRouter", "green");
      }
      if (
        serverContent.includes("callAI") ||
        serverContent.includes("lib/ai-core")
      ) {
        log("  ✓ Backend uses shared AI core", "green");
      }
    } catch (e) {
      log(`  ⚠️  Could not read atoms-server.js: ${e.message}`, "yellow");
    }
  }

  return { score, total };
}

function validateMcpServer() {
  log("\n🛡️  Validating MCP Server Configuration...", "cyan");

  let score = 0;
  let total = 0;

  // Check kali-mcp-server.js
  total++;
  if (checkFile("kali-mcp-server.js", "Kali MCP Server")) {
    score++;
    try {
      const mcpContent = fs.readFileSync("kali-mcp-server.js", "utf8");

      // Check for key features
      const features = [
        { pattern: "/api/tools", name: "Tools listing endpoint" },
        { pattern: "/api/execute", name: "Command execution endpoint" },
        { pattern: "executeTool", name: "Tool execution function" },
        { pattern: "/health", name: "Health check endpoint" },
      ];

      features.forEach((feature) => {
        if (mcpContent.includes(feature.pattern)) {
          log(`  ✓ ${feature.name} implemented`, "green");
        }
      });

      // Count available tools
      const toolEndpoints = (
        mcpContent.match(/app\.post\('\/api\/tools\//g) || []
      ).length;
      log(`  ✓ ${toolEndpoints} tool-specific endpoints configured`, "green");
    } catch (e) {
      log(`  ⚠️  Could not read kali-mcp-server.js: ${e.message}`, "yellow");
    }
  }

  // Check MCP proxy configuration in atoms-server.js
  total++;
  if (fs.existsSync("atoms-server.js")) {
    score++;
    try {
      const serverContent = fs.readFileSync("atoms-server.js", "utf8");

      if (
        serverContent.includes("/api/kali") ||
        serverContent.includes("executeTool")
      ) {
        log("✓ Backend configured with tool execution", "green");
      }

      const kaliEndpoint = serverContent.match(/KALI_BACKEND[^\n]+/);
      if (kaliEndpoint) {
        log(`  ✓ Kali endpoint configured in backend`, "green");
      }
    } catch (e) {
      log(`  ⚠️  Could not read atoms-server.js: ${e.message}`, "yellow");
    }
  }

  // Check lib/ai-core.js (new AI module)
  total++;
  if (fs.existsSync("lib/ai-core.js")) {
    score++;
    try {
      const aiCoreContent = fs.readFileSync("lib/ai-core.js", "utf8");
      if (
        aiCoreContent.includes("callBedrockModel") ||
        aiCoreContent.includes("bedrock")
      ) {
        log("  ✓ AWS Bedrock fallback configured", "green");
      }
    } catch (e) {
      log(`  ⚠️  Could not read lib/ai-core.js: ${e.message}`, "yellow");
    }
  }

  // Check for package.json scripts
  total++;
  if (checkFile("package.json", "package.json")) {
    score++;
    try {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

      if (pkg.scripts) {
        if (pkg.scripts.start) {
          log("  ✓ Start script defined", "green");
        }
        if (pkg.scripts.test || pkg.scripts["test:api"]) {
          log("  ✓ Test scripts defined", "green");
        }
      }

      // Check for required dependencies
      const requiredDeps = ["express", "cors", "dotenv", "node-fetch"];
      const installedDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      requiredDeps.forEach((dep) => {
        if (installedDeps[dep]) {
          log(`  ✓ Dependency ${dep} installed`, "green");
        } else {
          log(`  ⚠️  Dependency ${dep} not found`, "yellow");
        }
      });
    } catch (e) {
      log(`  ⚠️  Could not read package.json: ${e.message}`, "yellow");
    }
  }

  return { score, total };
}

function validateUserTaskHandling() {
  log("\n👤 Validating User Task Handling Capability...", "cyan");

  let score = 0;
  let total = 0;

  // Check frontend files
  total++;
  if (checkFile("script.js", "Frontend script")) {
    score++;
    try {
      const scriptContent = fs.readFileSync("script.js", "utf8");

      const features = [
        { pattern: "CONFIG", name: "Configuration object" },
        { pattern: "BACKEND_API_URL", name: "Backend API URL" },
        { pattern: "KALI_MCP_ENDPOINT", name: "MCP endpoint configuration" },
        { pattern: "processCommand", name: "Command processing function" },
        { pattern: "executeCommand", name: "Command execution function" },
      ];

      features.forEach((feature) => {
        if (scriptContent.includes(feature.pattern)) {
          log(`  ✓ ${feature.name} present`, "green");
        }
      });
    } catch (e) {
      log(`  ⚠️  Could not read script.js: ${e.message}`, "yellow");
    }
  }

  // Check for test files
  total++;
  const testFiles = ["test.js", "test-api-and-mcp.js"];
  let foundTests = false;

  testFiles.forEach((testFile) => {
    if (fs.existsSync(testFile)) {
      log(`✓ Test file exists: ${testFile}`, "green");
      foundTests = true;
    }
  });

  if (foundTests) {
    score++;
  } else {
    log("⚠️  No test files found", "yellow");
  }

  // Check README for usage instructions
  total++;
  if (checkFile("README.md", "README.md")) {
    score++;
    try {
      const readmeContent = fs.readFileSync("README.md", "utf8");

      if (readmeContent.includes("Usage") || readmeContent.includes("usage")) {
        log("  ✓ Usage instructions in README", "green");
      }
      if (readmeContent.includes("API") || readmeContent.includes("api")) {
        log("  ✓ API documentation in README", "green");
      }
    } catch (e) {
      log(`  ⚠️  Could not read README.md: ${e.message}`, "yellow");
    }
  }

  return { score, total };
}

function generateReport(apiResult, mcpResult, taskResult) {
  log("\n" + "=".repeat(60), "cyan");
  log("📊 Validation Report", "cyan");
  log("=".repeat(60), "cyan");

  const totalScore = apiResult.score + mcpResult.score + taskResult.score;
  const totalPossible = apiResult.total + mcpResult.total + taskResult.total;
  const percentage = Math.round((totalScore / totalPossible) * 100);

  log(
    `\n🔑 API Key Configuration:      ${apiResult.score}/${apiResult.total}`,
    apiResult.score === apiResult.total ? "green" : "yellow",
  );
  log(
    `🛡️  MCP Server Configuration:   ${mcpResult.score}/${mcpResult.total}`,
    mcpResult.score === mcpResult.total ? "green" : "yellow",
  );
  log(
    `👤 User Task Handling:         ${taskResult.score}/${taskResult.total}`,
    taskResult.score === taskResult.total ? "green" : "yellow",
  );

  log(
    `\n📈 Overall Score: ${totalScore}/${totalPossible} (${percentage}%)`,
    percentage >= 80 ? "green" : percentage >= 60 ? "yellow" : "red",
  );

  log("\n" + "=".repeat(60), "cyan");

  if (percentage >= 80) {
    log("✅ System is properly configured!", "green");
    log("\nNext steps:", "blue");
    log("  1. Start the backend: npm start", "blue");
    log("  2. Open index.html in a browser", "blue");
    log('  3. Test with a command like "scan example.com"', "blue");
    return 0;
  } else if (percentage >= 60) {
    log("⚠️  System is partially configured. Review warnings above.", "yellow");
    return 1;
  } else {
    log("❌ System configuration incomplete. Fix errors above.", "red");
    return 2;
  }
}

function main() {
  log("\n" + "=".repeat(60), "magenta");
  log("🥷 Atoms Ninja - Configuration Validation", "magenta");
  log("=".repeat(60), "magenta");

  const apiResult = validateApiKey();
  const mcpResult = validateMcpServer();
  const taskResult = validateUserTaskHandling();

  const exitCode = generateReport(apiResult, mcpResult, taskResult);

  log("\n💡 Tips:", "blue");
  log("  • Make sure to set GEMINI_API_KEY in your .env file", "blue");
  log('  • Run "npm install" to install dependencies', "blue");
  log('  • Run "npm start" to start the backend server', "blue");
  log(
    '  • Run "npm test:api" to test the API (requires servers running)',
    "blue",
  );
  log("");

  process.exit(exitCode);
}

main();
