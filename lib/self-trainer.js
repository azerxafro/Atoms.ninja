/**
 * Self-Training AI Engine
 * Automatically tests scripts, learns from results, and improves
 * Integrates with MCP servers for real-time data and research
 */

const labSandbox = require("./lab-sandbox");
const mcpServers = require("./mcp-servers");

const TRAINING_CONFIG = {
  maxIterations: parseInt(process.env.TRAINING_MAX_ITERATIONS) || 10,
  minSuccessRate: parseFloat(process.env.TRAINING_MIN_SUCCESS) || 0.8,
  parallelTests: parseInt(process.env.TRAINING_PARALLEL) || 2,
  feedbackWeight: 0.3,
  autoDeploy: process.env.TRAINING_AUTO_DEPLOY === "true",
};

class TestResult {
  constructor(scriptName, iteration) {
    this.scriptName = scriptName;
    this.iteration = iteration;
    this.success = false;
    this.output = "";
    this.errors = [];
    this.duration = 0;
    this.score = 0;
    this.feedback = "";
    this.timestamp = new Date().toISOString();
  }

  calculateScore() {
    // Score based on success, duration, and error count
    let score = 0;

    // Success factor (50%)
    if (this.success) score += 50;

    // Duration factor (20%) - faster is better
    if (this.duration < 5000) score += 20;
    else if (this.duration < 10000) score += 10;
    else score += 5;

    // Error factor (30%) - fewer errors is better
    const errorPenalty = Math.min(this.errors.length * 10, 30);
    score += 30 - errorPenalty;

    this.score = score;
    return score;
  }
}

class TrainingSession {
  constructor(config = {}) {
    this.id = `session-${Date.now()}`;
    this.config = { ...TRAINING_CONFIG, ...config };
    this.iterations = [];
    this.currentIteration = 0;
    this.bestScore = 0;
    this.bestScript = null;
    this.results = [];
    this.status = "initialized";
    this.mcpData = {};
  }

  async runIteration() {
    this.currentIteration++;
    this.status = "training";

    console.log(
      `[Training ${this.id}] Starting iteration ${this.currentIteration}`,
    );

    // Gather MCP data for this iteration
    await this.gatherMCPData();

    // Run test scripts
    const testResults = await this.runTests();

    // Analyze results
    const analysis = this.analyzeResults(testResults);

    // Store iteration data
    this.iterations.push({
      iteration: this.currentIteration,
      results: testResults,
      analysis,
      timestamp: new Date().toISOString(),
    });

    // Update best if improved
    if (analysis.averageScore > this.bestScore) {
      this.bestScore = analysis.averageScore;
      this.bestScript = analysis.bestScript;
    }

    console.log(
      `[Training ${this.id}] Iteration ${this.currentIteration} complete. Score: ${analysis.averageScore}`,
    );

    // Check if should continue
    const shouldContinue =
      this.currentIteration < this.config.maxIterations &&
      analysis.averageScore < this.config.minSuccessRate * 100;

    if (!shouldContinue) {
      this.status =
        analysis.averageScore >= this.config.minSuccessRate * 100
          ? "completed"
          : "max_iterations";
    }

    return {
      iteration: this.currentIteration,
      analysis,
      shouldContinue,
      status: this.status,
    };
  }

  async gatherMCPData() {
    // Gather data from various MCPs to enhance training
    const sources = [];

    try {
      // Get weather data
      const weatherData = await mcpServers.executeRequest("weather", {
        lat: 40.7128,
        lon: -74.006,
      });
      this.mcpData.weather = weatherData;
      sources.push("weather");
    } catch (e) {
      console.log("Weather MCP unavailable");
    }

    try {
      // Get crypto prices
      const btc = await mcpServers.executeRequest("okx", {
        symbol: "BTC-USDT",
      });
      this.mcpData.crypto = btc;
      sources.push("okx");
    } catch (e) {
      console.log("OKX MCP unavailable");
    }

    try {
      // Search for latest security research
      const search = await mcpServers.executeRequest("brave-search", {
        query: "latest penetration testing tools 2024",
      });
      this.mcpData.research = search;
      sources.push("brave-search");
    } catch (e) {
      console.log("Brave Search MCP unavailable");
    }

    console.log(
      `[Training ${this.id}] Gathered data from: ${sources.join(", ") || "none"}`,
    );
  }

  async runTests() {
    const testScripts = [
      "network-scan.sh",
      "port-scan.sh",
      "vuln-scan.sh",
      "ssl-check.sh",
      "dns-enum.sh",
    ];

    const results = [];

    // Run tests in parallel (limited)
    const batchSize = Math.min(this.config.parallelTests, testScripts.length);

    for (let i = 0; i < testScripts.length; i += batchSize) {
      const batch = testScripts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (script) => {
        try {
          const result = await labSandbox.executeOnSandbox(script, {
            TARGET: process.env.TEST_TARGET || "localhost",
            ITERATION: this.currentIteration,
          });

          const testResult = new TestResult(script, this.currentIteration);
          testResult.success = result.success;
          testResult.output = result.result?.stdout || "";
          testResult.errors = result.result?.stderr
            ? [result.result.stderr]
            : [];
          testResult.duration = result.duration || 0;
          testResult.calculateScore();

          return testResult;
        } catch (error) {
          const testResult = new TestResult(script, this.currentIteration);
          testResult.errors.push(error.message);
          testResult.calculateScore();
          return testResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  analyzeResults(results) {
    if (!results.length) {
      return { averageScore: 0, bestScript: null, successRate: 0 };
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalScore / results.length;
    const successCount = results.filter((r) => r.success).length;
    const successRate = successCount / results.length;

    const bestResult = results.reduce(
      (best, r) => (r.score > (best?.score || 0) ? r : best),
      null,
    );

    return {
      averageScore: Math.round(averageScore),
      successRate: Math.round(successRate * 100),
      bestScript: bestResult?.scriptName,
      totalTests: results.length,
      passedTests: successCount,
      failedTests: results.length - successCount,
    };
  }

  getReport() {
    return {
      id: this.id,
      status: this.status,
      currentIteration: this.currentIteration,
      maxIterations: this.config.maxIterations,
      bestScore: this.bestScore,
      bestScript: this.bestScript,
      successRate:
        this.results.length > 0
          ? Math.round(
              (this.results.filter((r) => r.success).length /
                this.results.length) *
                100,
            )
          : 0,
      mcpSources: Object.keys(this.mcpData),
      iterations: this.iterations,
    };
  }
}

class SelfTrainingEngine {
  constructor() {
    this.sessions = new Map();
    this.activeSession = null;
    this.scriptLibrary = new Map();
    this.initializeScripts();
  }

  initializeScripts() {
    // Default script templates
    this.scriptLibrary.set("network-scan.sh", {
      name: "Network Scanner",
      description: "Scans network for active hosts",
      template: `#!/bin/bash
# Network Scan Script - Iteration: $ITERATION
echo "Starting network scan..."
nmap -sn 192.168.1.0/24 || echo "nmap not available"
echo "Scan complete"
`,
      successRate: 0,
      avgDuration: 0,
      lastUpdated: null,
    });

    this.scriptLibrary.set("port-scan.sh", {
      name: "Port Scanner",
      description: "Scans target for open ports",
      template: `#!/bin/bash
# Port Scan Script
echo "Scanning ports on $TARGET"
echo "Complete"
`,
      successRate: 0,
      avgDuration: 0,
      lastUpdated: null,
    });
  }

  async startTrainingSession(config = {}) {
    const session = new TrainingSession(config);
    this.sessions.set(session.id, session);
    this.activeSession = session;

    console.log(`[SelfTrainer] Started training session ${session.id}`);

    // Run training loop
    while (session.status === "initialized" || session.status === "training") {
      const result = await session.runIteration();

      if (!result.shouldContinue) {
        break;
      }

      // Small delay between iterations
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return session.getReport();
  }

  async getStatus() {
    const mcpStatus = mcpServers.getStatus();
    const enabledMcps = Object.entries(mcpStatus).filter(([_, v]) => v.enabled);

    return {
      activeSession: this.activeSession?.id || null,
      totalSessions: this.sessions.size,
      scriptCount: this.scriptLibrary.size,
      enabledMCPs: enabledMcps.length,
      mcpStatus,
      config: TRAINING_CONFIG,
    };
  }

  getScripts() {
    const scripts = [];
    for (const [name, data] of this.scriptLibrary) {
      scripts.push({ name, ...data });
    }
    return scripts;
  }

  async improveScript(scriptName, feedback) {
    const script = this.scriptLibrary.get(scriptName);
    if (!script) {
      throw new Error(`Script ${scriptName} not found`);
    }

    // Apply improvements based on feedback
    let improved = script.template;

    if (feedback.includes("timeout")) {
      improved = improved.replace("sleep 10", "sleep 5");
    }

    if (feedback.includes("error")) {
      // Add error handling
      improved = `#!/bin/bash
set -e
${improved}
`;
    }

    script.template = improved;
    script.lastUpdated = new Date().toISOString();

    return script;
  }
}

module.exports = new SelfTrainingEngine();
