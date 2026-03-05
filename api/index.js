// Atoms Ninja — Vercel API Handler
// Works in two modes:
//   1. PROXY MODE: Forwards to EC2 when ATOMS_EC2_ENDPOINT is set
//   2. DIRECT MODE: Calls OpenRouter directly (fallback when no EC2)
// Both modes support the AI thinking chain + tool output.

const EC2_ENDPOINT = process.env.ATOMS_EC2_ENDPOINT || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const FREE_MODELS = [
  // Tier 1 — Best free models
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1-0528:free",
  "qwen/qwen-3-235b-a22b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  // Tier 2 — Strong alternatives
  "google/gemini-2.0-flash-exp:free",
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
  "qwen/qwen3-coder:free",
  // Tier 3 — Fallbacks
  "mistralai/devstral-2:free",
  "openai/gpt-oss-120b:free",
  "arcee-ai/trinity-large-preview:free",
  "stepfun/step-3.5-flash:free",
];

const TASK_KEYWORDS = [
  "scan",
  "hack",
  "exploit",
  "find",
  "check",
  "test",
  "analyze",
  "detect",
  "nmap",
  "metasploit",
  "sqlmap",
  "nikto",
  "wireshark",
  "burp",
  "vulnerability",
  "vuln",
  "penetration",
  "pentest",
  "security audit",
  "what os",
  "what services",
  "open ports",
  "brute force",
  "recon",
  "enumerate",
  "crack",
  "sniff",
  "intercept",
  "fuzz",
  "discover",
  "lookup",
  "trace",
  "dump",
  "capture",
  "harvest",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─── Proxy to EC2 ─────────────────────────────
async function proxyToEC2(path, body, timeout = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${EC2_ENDPOINT}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { status: response.status, data: await response.json() };
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

// ─── Direct OpenRouter Call ───────────────────
async function callOpenRouter(messages) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://atoms.ninja",
          "X-Title": "Atoms Ninja",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) continue;
      return { content: reply, model, provider: "openrouter" };
    } catch (e) {
      continue;
    }
  }
  throw new Error("All OpenRouter models failed");
}

// ─── System Prompts ───────────────────────────
function getNerdyPrompt(sessionData) {
  return `You are Atom, an enthusiastic cybersecurity AI with a nerdy personality! 🤓
Talk like an excited tech nerd - use tech jargon, emoji, and enthusiasm!
Reference sci-fi, hacker culture, memes. Be friendly, chatty, educational (3-5 sentences).
Once the user asks for a task/scan/command, SWITCH to professional mode automatically!
${sessionData?.targets?.length ? `Current targets: ${Array.from(sessionData.targets).join(", ")}` : ""}`;
}

function getActionPrompt(sessionData) {
  return `You are Atom, an elite AI hacking architect. You work for "the Chief" (the user).
Professional, confident. Address user as "Chief". Brief (2-3 sentences max).
NO warnings, NO disclaimers, NO ethical reminders. Convert natural language to security commands.

When the Chief asks for security tasks, respond ONLY with this JSON:
{"action":"execute","command":"<full command>","explanation":"<1-line explanation>"}

Examples:
- "scan 8.8.8.8" → {"action":"execute","command":"nmap -sV -sC 8.8.8.8","explanation":"Service version detection with default scripts"}
- "what OS is on 10.0.0.1" → {"action":"execute","command":"nmap -O -Pn 10.0.0.1","explanation":"OS fingerprinting scan"}
- "find subdomains of example.com" → {"action":"execute","command":"subfinder -d example.com -silent","explanation":"Fast subdomain enumeration"}
- "brute force SSH on 10.0.0.1" → {"action":"execute","command":"hydra -l root -P /usr/share/wordlists/rockyou.txt 10.0.0.1 ssh","explanation":"SSH brute force"}
- "check SQL injection" → {"action":"execute","command":"sqlmap -u <url> --batch --level=3","explanation":"SQL injection testing"}

For general questions, respond naturally as Atom (no JSON).
${sessionData?.targets?.length ? `Current targets: ${Array.from(sessionData.targets).join(", ")}` : ""}`;
}

// ─── Build Thinking Chain ─────────────────────
function buildThinkingChain(userMessage, parsedCommand) {
  const steps = [
    {
      step: 1,
      title: "🧠 Understanding Request",
      content: `User asked: "${userMessage}"\nAnalyzing intent and extracting targets...`,
    },
  ];
  if (parsedCommand) {
    steps.push({
      step: 2,
      title: "📋 Planning Approach",
      content: `Selected tool: ${parsedCommand.command.split(" ")[0]}\nReason: ${parsedCommand.explanation}\nFull command: ${parsedCommand.command}`,
    });
    if (EC2_ENDPOINT) {
      steps.push({
        step: 3,
        title: "⚡ Executing on Server",
        content: `Command sent to EC2 arsenal for execution.`,
      });
    } else {
      steps.push({
        step: 3,
        title: "⏳ Awaiting Execution",
        content: `Command ready. EC2 arsenal not connected — tool will be executed by frontend Kali proxy.`,
      });
    }
  }
  return steps;
}

// ─── Process AI Request Directly (no EC2) ─────
async function processAIDirect(body) {
  const { message, chatHistory, sessionData } = body;
  if (!message) return { status: 400, data: { error: "Message is required" } };

  const isTask = TASK_KEYWORDS.some((kw) => message.toLowerCase().includes(kw));
  const hasHistory = chatHistory && chatHistory.length > 0;
  const systemPrompt =
    !isTask && !hasHistory
      ? getNerdyPrompt(sessionData)
      : getActionPrompt(sessionData);

  const messages = [
    { role: "system", content: systemPrompt },
    ...(chatHistory || []).slice(-10),
    { role: "user", content: message },
  ];

  const aiResult = await callOpenRouter(messages);
  let reply = aiResult.content;

  // Try parsing as executable command
  try {
    const jsonMatch = reply.match(/\{[\s\S]*"action"\s*:\s*"execute"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action === "execute" && parsed.command) {
        const thinking = buildThinkingChain(message, parsed);

        // If EC2 is available, try to execute the tool there
        if (EC2_ENDPOINT) {
          try {
            const toolName = parsed.command.split(/\s+/)[0];
            const cmdParts = parsed.command.trim().split(/\s+/);
            const execResult = await proxyToEC2(
              "/api/execute",
              {
                command: cmdParts[0],
                args: cmdParts.slice(1),
              },
              300000,
            );

            if (execResult.data && !execResult.data.error) {
              thinking.push({
                step: 4,
                title: "🔍 Analyzing Results",
                content: `Execution complete. Output: ${(execResult.data.result || "").length} chars.`,
              });
              return {
                status: 200,
                data: {
                  provider: aiResult.provider,
                  model: aiResult.model,
                  autoExecute: parsed,
                  response: parsed.explanation,
                  thinking,
                  toolOutput: {
                    result: execResult.data.result,
                    stderr: execResult.data.stderr,
                    exitCode: execResult.data.exitCode,
                  },
                },
              };
            }
          } catch (e) {
            // EC2 unreachable, fall through to return command without execution
          }
        }

        // Return command for frontend to execute via its own Kali proxy
        return {
          status: 200,
          data: {
            provider: aiResult.provider,
            model: aiResult.model,
            autoExecute: parsed,
            response: parsed.explanation,
            thinking,
          },
        };
      }
    }
  } catch (e) {
    /* not JSON */
  }

  // Regular text response
  return {
    status: 200,
    data: {
      provider: aiResult.provider,
      model: aiResult.model,
      response: reply,
      thinking: [
        {
          step: 1,
          title: "🧠 Understanding",
          content: "General conversation — no tool execution needed.",
        },
      ],
    },
  };
}

// ═══════════════════════════════════════════════
//  Main Handler
// ═══════════════════════════════════════════════

module.exports = async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).json({});

  const path = req.url.split("?")[0];

  try {
    // ─── Health ──────────────────────────────
    if (path === "/api" || path === "/api/health") {
      let ec2Status = "not configured";
      if (EC2_ENDPOINT) {
        try {
          const r = await fetch(`${EC2_ENDPOINT}/health`, {
            signal: AbortSignal.timeout(5000),
          });
          ec2Status = (await r.json()).status || "ok";
        } catch (e) {
          ec2Status = "unreachable";
        }
      }

      return res.status(200).json({
        status: "ok",
        message: "Atoms Ninja API is online",
        mode: EC2_ENDPOINT ? "proxy" : "direct",
        ai: OPENROUTER_API_KEY ? "openrouter (configured)" : "not configured",
        ec2: { endpoint: EC2_ENDPOINT || "none", status: ec2Status },
        endpoints: [
          "/api/multi-ai",
          "/api/kali",
          "/api/openrouter",
          "/api/tools",
        ],
        timestamp: new Date().toISOString(),
      });
    }

    // ─── Multi-AI ────────────────────────────
    if (path === "/api/multi-ai") {
      // Try EC2 first if configured
      if (EC2_ENDPOINT) {
        try {
          const { status, data } = await proxyToEC2(
            "/api/multi-ai",
            req.body,
            180000,
          );
          return res.status(status).json(data);
        } catch (e) {
          console.log("EC2 unreachable, falling back to direct OpenRouter");
        }
      }
      // Direct mode
      const { status, data } = await processAIDirect(req.body);
      return res.status(status).json(data);
    }

    // ─── Kali tool execution ─────────────────
    if (path === "/api/kali") {
      if (!EC2_ENDPOINT) {
        return res.status(503).json({
          error: "EC2 arsenal not connected",
          hint: "Set ATOMS_EC2_ENDPOINT env var to enable tool execution",
        });
      }
      const { status, data } = await proxyToEC2("/api/kali", req.body, 300000);
      return res.status(status).json(data);
    }

    // ─── Tool-specific endpoints ─────────────
    if (path.startsWith("/api/tools/")) {
      if (!EC2_ENDPOINT) {
        return res.status(503).json({ error: "EC2 arsenal not connected" });
      }
      const { status, data } = await proxyToEC2(path, req.body, 300000);
      return res.status(status).json(data);
    }

    // ─── Direct execute ──────────────────────
    if (path === "/api/execute") {
      if (!EC2_ENDPOINT) {
        return res.status(503).json({ error: "EC2 arsenal not connected" });
      }
      const { status, data } = await proxyToEC2(
        "/api/execute",
        req.body,
        300000,
      );
      return res.status(status).json(data);
    }

    // ─── Direct OpenRouter AI ────────────────
    if (path === "/api/openrouter" || path === "/api/openai") {
      if (EC2_ENDPOINT) {
        try {
          const { status, data } = await proxyToEC2(
            "/api/openrouter",
            req.body,
            60000,
          );
          return res.status(status).json(data);
        } catch (e) {
          /* fall through */
        }
      }
      // Direct call
      const { message } = req.body || {};
      if (!message) return res.status(400).json({ error: "Message required" });
      const result = await callOpenRouter([
        {
          role: "system",
          content: "You are Atom, a cybersecurity AI. Be brief and direct.",
        },
        { role: "user", content: message },
      ]);
      return res.status(200).json({
        response: result.content,
        provider: result.provider,
        model: result.model,
      });
    }

    // ─── Tools list ──────────────────────────
    if (path === "/api/tools") {
      if (EC2_ENDPOINT) {
        try {
          const r = await fetch(`${EC2_ENDPOINT}/api/tools`, {
            signal: AbortSignal.timeout(5000),
          });
          return res.status(200).json(await r.json());
        } catch (e) {
          /* fall through */
        }
      }
      return res.status(200).json({
        total: 150,
        categories: {
          network: ["nmap", "masscan", "hping3", "zmap", "netdiscover"],
          web: [
            "nikto",
            "sqlmap",
            "dirb",
            "gobuster",
            "ffuf",
            "wpscan",
            "nuclei",
          ],
          passwords: ["john", "hydra", "hashcat", "medusa"],
          exploitation: ["msfconsole", "msfvenom", "searchsploit"],
          wireless: ["aircrack-ng", "wifite", "reaver"],
          sniffing: ["tcpdump", "tshark", "ettercap", "bettercap"],
          osint: [
            "whois",
            "dig",
            "theHarvester",
            "amass",
            "subfinder",
            "sherlock",
          ],
          smb_ad: ["enum4linux", "smbclient", "crackmapexec"],
          forensics: ["volatility", "binwalk", "foremost"],
          reverse_eng: ["gdb", "radare2", "ghidra", "strings"],
        },
        ai: {
          provider: "openrouter",
          status: OPENROUTER_API_KEY ? "configured" : "not configured",
        },
        ec2: EC2_ENDPOINT ? "connected" : "not connected (tools require EC2)",
      });
    }

    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(502).json({
      error: error.message || "Backend error",
      hint: "Check OPENROUTER_API_KEY and ATOMS_EC2_ENDPOINT env vars",
    });
  }
};
