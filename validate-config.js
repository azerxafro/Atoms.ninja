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
  log("\n📋 Validating AI API Key Configuration...", "cyan");

  let score = 0;
  let total = 0;

  // Check .env file
  total++;
  if (checkFile(".env", "Production .env file")) {
    score++;
  } else if (checkFile(".env.example", ".env.example file")) {
    log("  ⚠️  Using .env.example - please create a real .env file", "yellow");
  }

  // Check AI Provider Keys
  const providers = [
    { key: "VENICE_API_KEY", name: "Venice.ai (Primary)" },
    { key: "OPENROUTER_API_KEY", name: "OpenRouter (Secondary)" },
    { key: "AWS_ACCESS_KEY_ID", name: "AWS Bedrock (Fallback)" },
  ];

  providers.forEach((p) => {
    total++;
    const key = process.env[p.key];
    if (key && key.length > 5) {
      log(`✓ ${p.name} configured: ${key.substring(0, 8)}...`, "green");
      score++;
    } else {
      log(`✗ ${p.name} NOT found in environment`, "red");
    }
  });

  // Check shared-config.js for CORS
  total++;
  if (checkFile("shared-config.js", "Shared configuration")) {
    score++;
  }

  // Check atoms-server.js
  total++;
  if (checkFile("atoms-server.js", "Backend server (atoms-server.js)")) {
    score++;
    try {
      const serverContent = fs.readFileSync("atoms-server.js", "utf8");
      if (
        serverContent.includes("VENICE_API_KEY") ||
        serverContent.includes("OPENROUTER_API_KEY")
      ) {
        log("  ✓ Backend configured for modern AI stack", "green");
      }
      if (serverContent.includes("lib/ai-core")) {
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

  // Check main entry point
  total++;
  if (checkFile("index.html", "Main index.html")) {
    score++;
  }

  // Check styles
  total++;
  if (checkFile("styles.css", "Application CSS")) {
    score++;
  }

  total++;
  const testFiles = [
    "tests/test.js",
    "tests/test-api-and-mcp.js",
    "tests/verify-ai.js",
  ];
  let foundTests = false;

  testFiles.forEach((testFile) => {
    if (fs.existsSync(testFile)) {
      log(`✓ Test found: ${testFile}`, "green");
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
