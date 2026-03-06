#!/usr/bin/env node
/**
 * Atoms Ninja — Unified AI + Kali Security Server
 * Full Natural Language Executive Cybersecurity Arsenal
 *
 * User speaks natural language → AI thinks + plans → executes tool → returns results
 * AI thought process is returned as a collapsible chain for the frontend
 *
 * ALL Kali Linux tools supported via whitelisted execution.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const rateLimit = require("express-rate-limit");

const {
  TASK_KEYWORDS,
  getNerdyPrompt,
  getActionPrompt,
  callAI,
  buildThinkingChain,
} = require("./lib/ai-core");

// Backward-compat alias (used in /api/openrouter route below)
const callOpenRouter = (messages, model) =>
  callAI(messages, model ? { model } : {});

const app = express();
const PORT = process.env.PORT || 3001;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ═══════════════════════════════════════════════
//  COMPLETE Kali Arsenal — ALL Commands
// ═══════════════════════════════════════════════

const ALLOWED_COMMANDS = [
  // ── Network Scanning & Discovery ──
  "nmap",
  "masscan",
  "hping3",
  "zmap",
  "netdiscover",
  "arp-scan",
  "fping",
  "arping",
  "nbtscan",
  "unicornscan",

  // ── Vulnerability Scanning ──
  "nikto",
  "openvas",
  "lynis",
  "sslscan",
  "sslyze",
  "testssl.sh",
  "legion",
  "vulscan",

  // ── Web Application Testing ──
  "sqlmap",
  "dirb",
  "gobuster",
  "wfuzz",
  "ffuf",
  "dirsearch",
  "wpscan",
  "whatweb",
  "wafw00f",
  "httprobe",
  "httpx",
  "nuclei",
  "dalfox",
  "xsstrike",
  "commix",
  "cadaver",
  "skipfish",
  "parsero",
  "uniscan",
  "lbd",

  // ── Password Cracking & Brute Force ──
  "john",
  "hydra",
  "hashcat",
  "medusa",
  "ncrack",
  "patator",
  "cewl",
  "crunch",
  "hash-identifier",
  "hashid",
  "ophcrack",
  "rainbowcrack",
  "chntpw",

  // ── Exploitation Frameworks ──
  "msfconsole",
  "msfvenom",
  "searchsploit",
  "exploitdb",
  "beef-xss",
  "setoolkit",
  "armitage",

  // ── Wireless Attacks ──
  "aircrack-ng",
  "airmon-ng",
  "airodump-ng",
  "aireplay-ng",
  "wifite",
  "reaver",
  "bully",
  "pixiewps",
  "fluxion",
  "kismet",
  "fern-wifi-cracker",
  "cowpatty",

  // ── Network Sniffing & MITM ──
  "tcpdump",
  "tshark",
  "ettercap",
  "bettercap",
  "mitmproxy",
  "responder",
  "arpspoof",
  "dnsspoof",
  "sslstrip",
  "wireshark",
  "dsniff",
  "macchanger",

  // ── Information Gathering & OSINT ──
  "whois",
  "dig",
  "host",
  "nslookup",
  "dnsrecon",
  "dnsenum",
  "fierce",
  "dnsmap",
  "dnsgen",
  "theHarvester",
  "amass",
  "sublist3r",
  "subfinder",
  "recon-ng",
  "maltego",
  "spiderfoot",
  "sherlock",
  "metagoofil",
  "exiftool",
  "foca",
  "whatweb",
  "httrack",
  "eyewitness",

  // ── SMB / Active Directory ──
  "enum4linux",
  "smbclient",
  "smbmap",
  "crackmapexec",
  "impacket",
  "rpcclient",
  "ldapsearch",
  "bloodhound",
  "kerbrute",
  "mimikatz",
  "rubeus",
  "powerview",

  // ── Reverse Engineering ──
  "gdb",
  "radare2",
  "r2",
  "ghidra",
  "objdump",
  "strings",
  "ltrace",
  "strace",
  "binwalk",

  // ── Forensics ──
  "autopsy",
  "foremost",
  "scalpel",
  "volatility",
  "bulk_extractor",
  "dc3dd",
  "dcfldd",
  "photorec",
  "testdisk",

  // ── Tunneling & Pivoting ──
  "ssh",
  "chisel",
  "proxychains",
  "socat",
  "netcat",
  "nc",
  "ncat",
  "sshuttle",
  "stunnel",
  "iodine",

  // ── Payload & Encoding ──
  "msfvenom",
  "veil",
  "shellter",
  "unicorn",

  // ── Social Engineering ──
  "setoolkit",
  "gophish",
  "king-phisher",

  // ── Reporting ──
  "cutycapt",
  "faraday",
  "dradis",

  // ── Utilities ──
  "curl",
  "wget",
  "python3",
  "python",
  "ruby",
  "perl",
  "go",
  "node",
  "php",
  "gcc",
  "make",
  "git",
  "netstat",
  "ss",
  "ip",
  "ifconfig",
  "route",
  "traceroute",
  "mtr",
  "lsof",
  "ps",
  "top",
  "htop",
  "cat",
  "grep",
  "awk",
  "sed",
  "base64",
  "xxd",
  "file",
  "find",
  "locate",
  "which",
];

const TOOL_TIMEOUTS = {
  nmap: 300000,
  masscan: 180000,
  nikto: 600000,
  sqlmap: 600000,
  dirb: 300000,
  gobuster: 300000,
  hydra: 600000,
  john: 600000,
  hashcat: 600000,
  wpscan: 300000,
  msfconsole: 600000,
  searchsploit: 60000,
  theHarvester: 180000,
  amass: 600000,
  subfinder: 180000,
  nuclei: 600000,
  ffuf: 300000,
  wfuzz: 300000,
  enum4linux: 180000,
  crackmapexec: 300000,
  "recon-ng": 300000,
  volatility: 300000,
  default: 120000,
};

// ═══════════════════════════════════════════════
//  Middleware
// ═══════════════════════════════════════════════

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests",
  }),
);

// ═══════════════════════════════════════════════
//  Tool Execution Engine
// ═══════════════════════════════════════════════

async function executeTool(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 120000;

    const alwaysSudoTools = [
      "masscan",
      "tcpdump",
      "aircrack-ng",
      "airmon-ng",
      "airodump-ng",
      "aireplay-ng",
      "hping3",
      "ettercap",
      "bettercap",
      "arpspoof",
      "macchanger",
      "netdiscover",
      "responder",
      "arp-scan",
      "wifite",
      "reaver",
    ];
    const nmapPrivilegedFlags = [
      "-O",
      "-sS",
      "-sU",
      "-sA",
      "-sW",
      "-sM",
      "--osscan-guess",
      "--traceroute",
    ];
    const needsNmapSudo =
      command === "nmap" &&
      args.some((arg) => nmapPrivilegedFlags.includes(arg));
    const needsSudo = alwaysSudoTools.includes(command) || needsNmapSudo;

    const actualCommand = needsSudo ? "sudo" : command;
    const actualArgs = needsSudo ? [command, ...args] : args;

    console.log(
      `🔧 Executing: ${actualCommand} ${actualArgs.join(" ")} (sudo: ${needsSudo})`,
    );

    const childProcess = spawn(actualCommand, actualArgs, {
      shell: false,
      env: { ...process.env, ...options.env },
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      childProcess.kill("SIGKILL");
      reject(new Error(`Command timed out after ${timeout / 1000}s`));
    }, timeout);

    childProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    childProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    childProcess.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    childProcess.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ═══════════════════════════════════════════════
//  Health Check
// ═══════════════════════════════════════════════

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Atoms Ninja — Full Arsenal Server",
    ai: OPENROUTER_API_KEY ? "openrouter (configured)" : "not configured",
    tools: ALLOWED_COMMANDS.length,
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════
//  POST /api/multi-ai — AI Chat + Auto-Execute
//  Returns: response + thinking chain + tool output
// ═══════════════════════════════════════════════

app.post("/api/multi-ai", async (req, res) => {
  try {
    const { message, chatHistory, sessionData, mode = "fast" } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const isTaskRequest = TASK_KEYWORDS.some((kw) =>
      message.toLowerCase().includes(kw),
    );
    const hasHistory = chatHistory && chatHistory.length > 0;
    const systemPrompt =
      !isTaskRequest && !hasHistory
        ? getNerdyPrompt(sessionData)
        : getActionPrompt(sessionData);

    const messages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).slice(-10),
      { role: "user", content: message },
    ];

    const aiResult = await callOpenRouter(messages);
    let reply = aiResult.content;

    // Try to parse as command JSON
    try {
      const jsonMatch = reply.match(
        /\{[\s\S]*"action"\s*:\s*"execute"[\s\S]*\}/,
      );
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action === "execute" && parsed.command) {
          const toolName = parsed.command.split(/\s+/)[0];

          if (ALLOWED_COMMANDS.includes(toolName)) {
            console.log(`⚡ AI auto-executing: ${parsed.command}`);
            const cmdParts = parsed.command.trim().split(/\s+/);
            const tool = cmdParts[0];
            const args = cmdParts.slice(1);
            const timeout = TOOL_TIMEOUTS[tool] || TOOL_TIMEOUTS.default;

            let toolOutput = null;
            let toolError = null;

            try {
              const result = await executeTool(tool, args, { timeout });
              toolOutput = {
                result: result.stdout,
                stderr: result.stderr,
                exitCode: result.code,
              };
            } catch (execErr) {
              toolError = execErr.message;
            }

            const thinking = buildThinkingChain(message, parsed, {
              toolResult: toolOutput,
            });

            return res.status(200).json({
              provider: aiResult.provider,
              model: aiResult.model,
              autoExecute: parsed,
              response: parsed.explanation,
              thinking: thinking,
              toolOutput: toolOutput,
              toolError: toolError,
            });
          }

          // Not whitelisted
          const thinking = buildThinkingChain(message, parsed);
          return res.status(200).json({
            provider: aiResult.provider,
            model: aiResult.model,
            autoExecute: parsed,
            response: parsed.explanation,
            thinking: thinking,
          });
        }
      }
    } catch (e) {
      /* not JSON */
    }

    // Regular text response
    return res.status(200).json({
      provider: aiResult.provider,
      model: aiResult.model,
      response: reply,
      thinking: [
        {
          step: 1,
          title: "🧠 Understanding",
          content: `Interpreted as general conversation. No tool execution needed.`,
        },
      ],
    });
  } catch (error) {
    console.error("Multi-AI Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════
//  POST /api/openrouter — Direct AI proxy
// ═══════════════════════════════════════════════

app.post("/api/openrouter", async (req, res) => {
  try {
    const { message, model } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    const result = await callOpenRouter(
      [
        {
          role: "system",
          content:
            "You are Atom, a cybersecurity AI assistant. Be brief and direct.",
        },
        { role: "user", content: message },
      ],
      model,
    );
    res.json({
      response: result.content,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════
//  POST /api/kali — Generic tool execution
// ═══════════════════════════════════════════════

app.post("/api/kali", async (req, res) => {
  try {
    const { tool, args = [] } = req.body;
    if (!tool) return res.status(400).json({ error: "Tool name required" });
    const argsArray =
      typeof args === "string" ? args.split(/\s+/).filter(Boolean) : args;
    if (!ALLOWED_COMMANDS.includes(tool))
      return res.status(403).json({ error: `Command '${tool}' not allowed` });
    res.setTimeout(300000);
    const timeout = TOOL_TIMEOUTS[tool] || TOOL_TIMEOUTS.default;
    const result = await executeTool(tool, argsArray, { timeout });
    res.json({
      command: tool,
      result: result.stdout,
      stderr: result.stderr,
      exitCode: result.code,
    });
  } catch (error) {
    if (error.message.includes("timeout"))
      res.status(504).json({ error: "Request timeout" });
    else res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════
//  POST /api/execute — Generic whitelisted execution
// ═══════════════════════════════════════════════

app.post("/api/execute", async (req, res) => {
  try {
    const { command, args = [] } = req.body;
    if (!command) return res.status(400).json({ error: "Command required" });
    if (!ALLOWED_COMMANDS.includes(command))
      return res.status(403).json({ error: "Command not allowed" });
    res.setTimeout(300000);
    const timeout = TOOL_TIMEOUTS[command] || TOOL_TIMEOUTS.default;
    const result = await executeTool(command, args, { timeout });
    res.json({
      command,
      result: result.stdout,
      stderr: result.stderr,
      exitCode: result.code,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════
//  Tool-specific endpoints (backwards compatible)
// ═══════════════════════════════════════════════

app.post("/api/tools/nmap", async (req, res) => {
  try {
    const { target, options = "-sV" } = req.body;
    if (!target) return res.status(400).json({ error: "Target required" });
    const opts =
      typeof options === "string"
        ? options.split(/\s+/).filter(Boolean)
        : options;
    const result = await executeTool("nmap", [...opts, target], {
      timeout: 300000,
    });
    res.json({ tool: "nmap", result: result.stdout, stderr: result.stderr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/nikto", async (req, res) => {
  try {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Target required" });
    const result = await executeTool("nikto", ["-h", target], {
      timeout: 600000,
    });
    res.json({ tool: "nikto", result: result.stdout, stderr: result.stderr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/sqlmap", async (req, res) => {
  try {
    const { url, options = "--batch --level=3" } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });
    const result = await executeTool(
      "sqlmap",
      ["-u", url, ...options.split(" ")],
      { timeout: 600000 },
    );
    res.json({ tool: "sqlmap", result: result.stdout, stderr: result.stderr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/hydra", async (req, res) => {
  try {
    const { target, service = "ssh", username, passwordList } = req.body;
    if (!target || !username)
      return res.status(400).json({ error: "Target and username required" });
    const pw = passwordList || "/usr/share/wordlists/rockyou.txt";
    const result = await executeTool(
      "hydra",
      ["-l", username, "-P", pw, target, service],
      { timeout: 600000 },
    );
    res.json({ tool: "hydra", result: result.stdout, stderr: result.stderr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/whois", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: "Domain required" });
    const result = await executeTool("whois", [domain], { timeout: 30000 });
    res.json({ tool: "whois", result: result.stdout, stderr: result.stderr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/dig", async (req, res) => {
  try {
    const { domain, type = "ANY" } = req.body;
    if (!domain) return res.status(400).json({ error: "Domain required" });
    const result = await executeTool("dig", [domain, type], { timeout: 30000 });
    res.json({ tool: "dig", result: result.stdout, stderr: result.stderr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/searchsploit", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });
    const result = await executeTool("searchsploit", [query], {
      timeout: 60000,
    });
    res.json({
      tool: "searchsploit",
      result: result.stdout,
      stderr: result.stderr,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/metasploit", async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "Command required" });
    const result = await executeTool("msfconsole", ["-q", "-x", command], {
      timeout: 600000,
    });
    res.json({
      tool: "metasploit",
      result: result.stdout,
      stderr: result.stderr,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════
//  GET /api/tools — List complete arsenal
// ═══════════════════════════════════════════════

app.get("/api/tools", (req, res) => {
  res.json({
    total: ALLOWED_COMMANDS.length,
    categories: {
      network_scanning: [
        "nmap",
        "masscan",
        "hping3",
        "zmap",
        "netdiscover",
        "arp-scan",
        "fping",
      ],
      vulnerability_scanning: [
        "nikto",
        "openvas",
        "lynis",
        "sslscan",
        "sslyze",
        "nuclei",
      ],
      web_testing: [
        "sqlmap",
        "dirb",
        "gobuster",
        "wfuzz",
        "ffuf",
        "wpscan",
        "whatweb",
        "wafw00f",
        "dalfox",
        "commix",
      ],
      password: [
        "john",
        "hydra",
        "hashcat",
        "medusa",
        "ncrack",
        "cewl",
        "crunch",
      ],
      exploitation: [
        "msfconsole",
        "msfvenom",
        "searchsploit",
        "beef-xss",
        "setoolkit",
      ],
      wireless: [
        "aircrack-ng",
        "airmon-ng",
        "airodump-ng",
        "wifite",
        "reaver",
        "kismet",
      ],
      sniffing_mitm: [
        "tcpdump",
        "tshark",
        "ettercap",
        "bettercap",
        "responder",
        "arpspoof",
        "sslstrip",
      ],
      osint: [
        "whois",
        "dig",
        "dnsrecon",
        "theHarvester",
        "amass",
        "sublist3r",
        "subfinder",
        "recon-ng",
        "sherlock",
      ],
      smb_ad: [
        "enum4linux",
        "smbclient",
        "smbmap",
        "crackmapexec",
        "ldapsearch",
        "kerbrute",
      ],
      forensics: [
        "autopsy",
        "foremost",
        "volatility",
        "binwalk",
        "bulk_extractor",
      ],
      reverse_engineering: [
        "gdb",
        "radare2",
        "ghidra",
        "objdump",
        "strings",
        "ltrace",
        "strace",
      ],
      tunneling: [
        "ssh",
        "chisel",
        "proxychains",
        "socat",
        "netcat",
        "sshuttle",
      ],
    },
    ai: {
      provider: "openrouter",
      models: FREE_MODELS,
      status: OPENROUTER_API_KEY ? "configured" : "not configured",
    },
  });
});

// ═══════════════════════════════════════════════
//  Start Server
// ═══════════════════════════════════════════════

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🛡️  ═══════════════════════════════════════════════`);
  console.log(`🛡️  Atoms Ninja — Full Arsenal Server`);
  console.log(`🛡️  ═══════════════════════════════════════════════`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🤖 AI: OpenRouter (${OPENROUTER_API_KEY ? "✅" : "❌"})`);
  console.log(`🔧 Tools: ${ALLOWED_COMMANDS.length} commands whitelisted`);
  console.log(`⚡ Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🛡️  ═══════════════════════════════════════════════\n`);
});

module.exports = app;
