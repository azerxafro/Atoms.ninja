/**
 * Virtual Lab Sandbox Manager
 * Provides isolated environments for testing scripts and attacks
 * Supports multiple sandbox types: Docker, VM, E2B, local
 */

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LAB_CONFIG = {
  type: process.env.LAB_TYPE || "docker", // docker, vm, e2b, local
  baseDir: process.env.LAB_BASE_DIR || "/tmp/atoms-lab",
  maxConcurrent: parseInt(process.env.LAB_MAX_CONCURRENT) || 3,
  timeout: parseInt(process.env.LAB_TIMEOUT) || 300000, // 5 minutes default
  autoCleanup: process.env.LAB_AUTO_CLEANUP !== "false",
};

class SandboxInstance {
  constructor(id, config = {}) {
    this.id = id;
    this.config = { ...LAB_CONFIG, ...config };
    this.status = "initializing";
    this.startTime = null;
    this.endTime = null;
    this.logs = [];
    this.results = null;
  }

  async start() {
    this.status = "starting";
    this.startTime = Date.now();

    try {
      switch (this.config.type) {
        case "docker":
          await this.startDocker();
          break;
        case "e2b":
          await this.startE2B();
          break;
        case "local":
          await this.startLocal();
          break;
        default:
          throw new Error(`Unknown sandbox type: ${this.config.type}`);
      }

      this.status = "running";
      this.log("Sandbox started successfully");
    } catch (error) {
      this.status = "failed";
      this.log(`Start failed: ${error.message}`);
      throw error;
    }
  }

  async startDocker() {
    const containerName = `atoms-lab-${this.id}`;
    const dockerCmd = [
      "docker",
      "run",
      "-d",
      "--name",
      containerName,
      "--network",
      "none",
      "--memory",
      "512m",
      "--cpus",
      "0.5",
      "--tmpfs",
      "/tmp:rw,noexec,size=64m",
      "--tmpfs",
      "/var/tmp:rw,noexec,size=32m",
      "kalilinux/kali-rolling:latest",
      "sleep",
      "infinity",
    ];

    return new Promise((resolve, reject) => {
      exec(dockerCmd.join(" "), (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Docker failed: ${stderr}`));
        } else {
          this.containerId = stdout.trim();
          resolve(this.containerId);
        }
      });
    });
  }

  async startE2B() {
    // E2B Sandbox integration
    const e2bApiKey = process.env.E2B_API_KEY;
    if (!e2bApiKey) {
      throw new Error("E2B_API_KEY not configured");
    }

    // E2B sandbox creation would go here
    // For now, simulate with local sandbox
    this.status = "running";
    this.log("E2B sandbox mode - using local fallback");
  }

  async startLocal() {
    // Create isolated local directory
    const sandboxDir = path.join(this.config.baseDir, this.id);
    fs.mkdirSync(sandboxDir, { recursive: true });
    fs.mkdirSync(path.join(sandboxDir, "scripts"), { recursive: true });
    fs.mkdirSync(path.join(sandboxDir, "results"), { recursive: true });
    fs.mkdirSync(path.join(sandboxDir, "logs"), { recursive: true });

    this.sandboxDir = sandboxDir;
    this.log(`Local sandbox created at ${sandboxDir}`);
  }

  async executeScript(scriptName, params = {}) {
    if (this.status !== "running") {
      throw new Error("Sandbox is not running");
    }

    const startTime = Date.now();
    this.log(`Executing script: ${scriptName}`);

    try {
      let result;
      switch (this.config.type) {
        case "docker":
          result = await this.executeDocker(scriptName, params);
          break;
        case "e2b":
          result = await this.executeE2B(scriptName, params);
          break;
        case "local":
          result = await this.executeLocal(scriptName, params);
          break;
      }

      const duration = Date.now() - startTime;
      this.log(`Script completed in ${duration}ms`);

      return {
        success: true,
        duration,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log(`Script failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async executeDocker(scriptName, params) {
    const scriptContent = this.getScriptContent(scriptName);
    const containerName = `atoms-lab-${this.id}`;

    // Write script to temp file
    const scriptPath = `/tmp/script-${Date.now()}.sh`;

    return new Promise((resolve, reject) => {
      // Copy script to container
      exec(`docker cp - ${containerName}:${scriptPath}`, (error) => {
        if (error) {
          reject(new Error(`Failed to copy script: ${error.message}`));
          return;
        }

        // Execute script
        exec(
          `docker exec ${containerName} bash ${scriptPath}`,
          {
            timeout: this.config.timeout,
          },
          (error, stdout, stderr) => {
            // Cleanup
            exec(`docker exec ${containerName} rm -f ${scriptPath}`);

            if (error && !stdout) {
              reject(new Error(stderr || error.message));
            } else {
              resolve({ stdout, stderr });
            }
          },
        );
      });
    });
  }

  async executeE2B(scriptName, params) {
    // E2B execution would go here
    // For now, return mock result
    return {
      output: "E2B sandbox execution simulated",
      script: scriptName,
      params,
    };
  }

  async executeLocal(scriptName, params) {
    const scriptPath = path.join(this.sandboxDir, "scripts", scriptName);
    const resultPath = path.join(
      this.sandboxDir,
      "results",
      `${Date.now()}.json`,
    );

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      // Create a default test script
      const defaultScript = this.getScriptContent(scriptName);
      fs.writeFileSync(scriptPath, defaultScript);
    }

    return new Promise((resolve, reject) => {
      const child = spawn("bash", [scriptPath], {
        cwd: this.sandboxDir,
        env: { ...process.env, ...params },
        timeout: this.config.timeout,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        this.log(`[OUT] ${data.toString().trim()}`);
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
        this.log(`[ERR] ${data.toString().trim()}`);
      });

      child.on("close", (code) => {
        const result = {
          code,
          stdout,
          stderr,
          resultPath,
        };

        // Save result
        fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

        resolve(result);
      });

      child.on("error", (error) => {
        reject(error);
      });
    });
  }

  getScriptContent(scriptName) {
    // Script registry - add your test scripts here
    const scripts = {
      "network-scan.sh": `#!/bin/bash
echo "Running network scan..."
nmap -sn 192.168.1.0/24 || echo "nmap not available, using alternative"
echo "Scan completed"
`,
      "vuln-scan.sh": `#!/bin/bash
echo "Running vulnerability scan..."
echo "Target: $TARGET"
echo "Scan completed"
`,
      "port-scan.sh": `#!/bin/bash
echo "Port scan on $TARGET"
echo "Completed"
`,
      "ssl-check.sh": `#!/bin/bash
echo "SSL/TLS analysis on $TARGET"
echo "Completed"
`,
      "dns-enum.sh": `#!/bin/bash
echo "DNS enumeration for $TARGET"
echo "Completed"
`,
    };

    return scripts[scriptName] || '#!/bin/bash\necho "Default test script"\n';
  }

  log(message) {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
    };
    this.logs.push(entry);
    console.log(`[Sandbox ${this.id}] ${message}`);
  }

  async stop() {
    if (this.status === "stopped") return;

    this.status = "stopping";
    this.log("Stopping sandbox...");

    try {
      switch (this.config.type) {
        case "docker":
          await this.stopDocker();
          break;
        case "local":
          await this.stopLocal();
          break;
      }

      this.status = "stopped";
      this.endTime = Date.now();
      this.log("Sandbox stopped");
    } catch (error) {
      this.log(`Stop error: ${error.message}`);
      throw error;
    }
  }

  async stopDocker() {
    const containerName = `atoms-lab-${this.id}`;

    return new Promise((resolve, reject) => {
      exec(
        `docker stop ${containerName} && docker rm ${containerName}`,
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async stopLocal() {
    // Cleanup local sandbox directory
    if (this.sandboxDir && fs.existsSync(this.sandboxDir)) {
      fs.rmSync(this.sandboxDir, { recursive: true, force: true });
      this.log(`Cleaned up ${this.sandboxDir}`);
    }
  }

  getInfo() {
    return {
      id: this.id,
      status: this.status,
      config: this.config,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime ? this.endTime - this.startTime : null,
      logs: this.logs,
    };
  }
}

class LabSandboxManager {
  constructor() {
    this.instances = new Map();
    this.instanceCounter = 0;
  }

  async createInstance(config = {}) {
    if (this.instances.size >= LAB_CONFIG.maxConcurrent) {
      throw new Error("Maximum concurrent instances reached");
    }

    const id = `lab-${Date.now()}-${++this.instanceCounter}`;
    const instance = new SandboxInstance(id, config);

    await instance.start();
    this.instances.set(id, instance);

    return instance;
  }

  async getInstance(id) {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Instance ${id} not found`);
    }
    return instance;
  }

  async executeOnSandbox(scriptName, params = {}, config = {}) {
    const instance = await this.createInstance(config);

    try {
      const result = await instance.executeScript(scriptName, params);
      return {
        instanceId: instance.id,
        ...result,
      };
    } finally {
      if (LAB_CONFIG.autoCleanup) {
        await instance.stop();
        this.instances.delete(instance.id);
      }
    }
  }

  async listInstances() {
    const list = [];
    for (const [id, instance] of this.instances) {
      list.push(instance.getInfo());
    }
    return list;
  }

  async cleanupAll() {
    const cleanupPromises = [];
    for (const [id, instance] of this.instances) {
      cleanupPromises.push(instance.stop().catch((e) => console.error(e)));
    }

    await Promise.all(cleanupPromises);
    this.instances.clear();
  }

  getStatus() {
    return {
      totalInstances: this.instances.size,
      maxConcurrent: LAB_CONFIG.maxConcurrent,
      config: LAB_CONFIG,
      instances: this.listInstances(),
    };
  }
}

module.exports = new LabSandboxManager();
