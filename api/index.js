// Atoms Ninja — Vercel API Handler
// All tool execution is proxied to EC2 — local execution is never allowed.
// AI-only queries can run directly when EC2 is unavailable.

const {
  corsHeaders,
  getCorsHeaders,
  ALLOWED_ORIGINS,
  TASK_KEYWORDS,
  getNerdyPrompt,
  getActionPrompt,
  callAI,
  buildThinkingChain,
} = require("../lib/ai-core");
const { resolveDomain, isValidDomain, extractDomain } = require("../lib/ip-resolver");
const DiscordSocial = require("../lib/discord-social");

const EC2_ENDPOINT = process.env.ATOMS_EC2_ENDPOINT || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const VENICE_API_KEY = process.env.VENICE_API_KEY || "";

// ─── Discord OAuth2 Config ────────────────────
const DISCORD_CLIENT_ID =
  process.env.DISCORD_CLIENT_ID || "1477862784774705283";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI ||
  "https://www.atoms.ninja/api/auth/discord/callback";
const DISCORD_SCOPES = "identify email connections guilds";

// ─── Cookie Helpers ───────────────────────────
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [name, ...rest] = pair.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

function setAuthCookie(res, encodedData) {
  res.setHeader("Set-Cookie", [
    `atoms_auth=${encodedData}; Domain=.atoms.ninja; Path=/; Secure; SameSite=Lax; Max-Age=604800`,
  ]);
}

function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", [
    `atoms_auth=; Domain=.atoms.ninja; Path=/; Secure; SameSite=Lax; Max-Age=0`,
  ]);
}

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

// ─── Discord OAuth2 Helpers ───────────────────
function generateState() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let state = "";
  for (let i = 0; i < 32; i++) {
    state += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return state;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: DISCORD_REDIRECT_URI,
  });

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Discord token exchange failed: ${err}`);
  }
  return response.json();
}

async function fetchDiscordUser(accessToken) {
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Discord user");
  }
  return response.json();
}

// ─── Process AI Request Directly (no EC2) ─────
// AI reasoning runs here; tool execution MUST go through EC2.
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

  const aiResult = await callAI(messages);
  let reply = aiResult.content;

  // Try parsing as executable command
  try {
    const jsonMatch = reply.match(/\{[\s\S]*"action"\s*:\s*"execute"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action === "execute" && parsed.command) {
        const thinking = buildThinkingChain(message, parsed, {
          ec2Endpoint: EC2_ENDPOINT,
        });

        // EC2 is REQUIRED for all tool execution — no local fallback
        if (!EC2_ENDPOINT) {
          thinking.push({
            step: 4,
            title: "⚠️ EC2 Arsenal Offline",
            content: "ATOMS_EC2_ENDPOINT not configured — tool execution unavailable.",
          });
          return {
            status: 503,
            data: {
              error: "EC2 arsenal not connected — cannot execute tools",
              hint: "Set ATOMS_EC2_ENDPOINT env var to enable tool execution",
              autoExecute: parsed,
              thinking,
            },
          };
        }

        try {
          const fullCmd = parsed.command.trim();
          const isChained = /[&|;]/.test(fullCmd);
          let execResult;

          if (isChained) {
            execResult = await proxyToEC2(
              "/api/execute-shell",
              { shellCommand: fullCmd },
              300000,
            );
          } else {
            const cmdParts = fullCmd.split(/\s+/);
            execResult = await proxyToEC2(
              "/api/execute",
              {
                command: cmdParts[0],
                args: cmdParts.slice(1),
              },
              300000,
            );
          }

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
          // EC2 unreachable — report error, never execute locally
          thinking.push({
            step: 4,
            title: "⚠️ EC2 Unreachable",
            content: `Could not reach EC2 arsenal: ${e.message}`,
          });
          return {
            status: 503,
            data: {
              error: "EC2 arsenal unreachable — tool execution failed",
              autoExecute: parsed,
              thinking,
            },
          };
        }

        // EC2 returned an error in the response body
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

  // Regular text response — BUT if this was a task query, retry with stronger JSON enforcement
  if (isTask) {
    try {
      const retryMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
        { role: "assistant", content: reply },
        {
          role: "user",
          content: `Please format your answer as a single JSON object with no surrounding text:\n{"action":"execute","command":"<full shell command>","explanation":"<1 line>"}\nOnly the JSON, nothing else.`,
        },
      ];
      const retryResult = await callAI(retryMessages);
      const retryMatch = retryResult.content.match(
        /\{[\s\S]*"action"\s*:\s*"execute"[\s\S]*\}/,
      );
      if (retryMatch) {
        const parsed = JSON.parse(retryMatch[0]);
        if (parsed.action === "execute" && parsed.command) {
          const thinking = buildThinkingChain(message, parsed, {
            ec2Endpoint: EC2_ENDPOINT,
          });

          if (EC2_ENDPOINT) {
            try {
              const fullCmd = parsed.command.trim();
              const isChained = /[&|;]/.test(fullCmd);
              let execResult;
              if (isChained) {
                execResult = await proxyToEC2(
                  "/api/execute-shell",
                  { shellCommand: fullCmd },
                  300000,
                );
              } else {
                const cmdParts = fullCmd.split(/\s+/);
                execResult = await proxyToEC2(
                  "/api/execute",
                  { command: cmdParts[0], args: cmdParts.slice(1) },
                  300000,
                );
              }
              if (execResult.data && !execResult.data.error) {
                thinking.push({
                  step: 4,
                  title: "🔍 Analyzing Results",
                  content: `Execution complete. Output: ${(execResult.data.result || "").length} chars.`,
                });
                return {
                  status: 200,
                  data: {
                    provider: retryResult.provider,
                    model: retryResult.model,
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
              // EC2 unreachable — return error, never execute locally
              thinking.push({
                step: 4,
                title: "⚠️ EC2 Unreachable",
                content: `Could not reach EC2 arsenal: ${e.message}`,
              });
              return {
                status: 503,
                data: {
                  error: "EC2 arsenal unreachable — tool execution failed",
                  autoExecute: parsed,
                  thinking,
                },
              };
            }
          } else {
            // No EC2 configured — refuse execution
            thinking.push({
              step: 4,
              title: "⚠️ EC2 Arsenal Offline",
              content: "ATOMS_EC2_ENDPOINT not configured — tool execution unavailable.",
            });
            return {
              status: 503,
              data: {
                error: "EC2 arsenal not connected — cannot execute tools",
                hint: "Set ATOMS_EC2_ENDPOINT env var to enable tool execution",
                autoExecute: parsed,
                thinking,
              },
            };
          }
          return {
            status: 200,
            data: {
              provider: retryResult.provider,
              model: retryResult.model,
              autoExecute: parsed,
              response: parsed.explanation,
              thinking,
            },
          };
        }
      }
    } catch (e) {
      /* retry failed, fall through to text response */
    }
  }

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
  // Use dynamic CORS headers based on requesting origin
  const origin = req.headers.origin;
  const headers = getCorsHeaders(origin || "");
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).json({});

  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const path = url.pathname;

  try {
    // ─── Discord OAuth: Redirect ─────────────
    if (path === "/api/auth/discord") {
      if (!DISCORD_CLIENT_ID) {
        return res.status(500).json({ error: "Discord OAuth not configured" });
      }
      const state = generateState();
      const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT_URI,
        response_type: "code",
        scope: DISCORD_SCOPES,
        state,
        prompt: "consent",
        integration_type: "1",
        permissions: "8",
      });
      res.setHeader(
        "Location",
        `https://discord.com/oauth2/authorize?${params}`,
      );
      return res.status(302).end();
    }

    // ─── Discord OAuth: Callback ─────────────
    if (path === "/api/auth/discord/callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      // Redirect to whichever host the user came from
      const frontendUrl = `https://${req.headers.host || "www.atoms.ninja"}`;

      if (error || !code) {
        res.setHeader(
          "Location",
          `${frontendUrl}?auth_error=${encodeURIComponent(error || "no_code")}`,
        );
        return res.status(302).end();
      }

      try {
        const tokenData = await exchangeCodeForToken(code);
        const user = await fetchDiscordUser(tokenData.access_token);

        // Build avatar URL
        const avatarUrl = user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

        const userData = {
          id: user.id,
          username: user.username,
          globalName: user.global_name || user.username,
          avatar: avatarUrl,
          email: user.email || null,
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
        };

        const encodedData = encodeURIComponent(
          Buffer.from(JSON.stringify(userData)).toString("base64"),
        );

        // Set cross-subdomain cookie (Domain=.atoms.ninja)
        setAuthCookie(res, encodedData);

        // Also pass via query param for backwards-compatible localStorage hydration
        res.setHeader("Location", `${frontendUrl}?discord_auth=${encodedData}`);
        return res.status(302).end();
      } catch (err) {
        console.error("Discord OAuth callback error:", err);
        res.setHeader(
          "Location",
          `${frontendUrl}?auth_error=${encodeURIComponent("token_exchange_failed")}`,
        );
        return res.status(302).end();
      }
    }

    // ─── Auth Session (cookie-based) ──────────
    if (path === "/api/auth/session") {
      const cookies = parseCookies(req.headers.cookie || "");
      const authCookie = cookies["atoms_auth"];
      if (!authCookie) {
        return res
          .status(401)
          .json({ authenticated: false, error: "No session" });
      }
      try {
        const userData = JSON.parse(
          Buffer.from(decodeURIComponent(authCookie), "base64").toString(),
        );
        // Validate token is still valid with Discord
        const user = await fetchDiscordUser(userData.accessToken);
        return res.json({ authenticated: true, user: userData });
      } catch (e) {
        clearAuthCookie(res);
        return res
          .status(401)
          .json({ authenticated: false, error: "Session expired" });
      }
    }

    // ─── Auth Sign Out ────────────────────────
    if (path === "/api/auth/signout") {
      clearAuthCookie(res);
      return res.json({ success: true, message: "Signed out" });
    }

    // ─── Discord OAuth: Validate Session ─────
    if (path === "/api/auth/me") {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }
      const token = authHeader.split(" ")[1];
      try {
        const user = await fetchDiscordUser(token);
        const avatarUrl = user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;
        return res.status(200).json({
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            globalName: user.global_name || user.username,
            avatar: avatarUrl,
            email: user.email || null,
          },
        });
      } catch (err) {
        return res
          .status(401)
          .json({ authenticated: false, error: "Invalid or expired token" });
      }
    }

    // ─── Discord Social: Set Activity ────────
    if (path === "/api/auth/social/activity") {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }
      const token = authHeader.split(" ")[1];
      try {
        const social = new DiscordSocial(token);
        const result = await social.setActivity(req.body);
        return res.status(200).json(result);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    // ─── Discord Social: Get Relationships ───
    if (path === "/api/auth/social/relationships") {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }
      const token = authHeader.split(" ")[1];
      try {
        const social = new DiscordSocial(token);
        const result = await social.getRelationships();
        return res.status(200).json(result);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

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
        ai: {
          primary: VENICE_API_KEY
            ? "venice"
            : OPENROUTER_API_KEY
              ? "openrouter"
              : "none",
          fallback: VENICE_API_KEY
            ? OPENROUTER_API_KEY
              ? "openrouter"
              : "bedrock"
            : "bedrock (aws)",
          status: VENICE_API_KEY
            ? "configured (venice)"
            : OPENROUTER_API_KEY
              ? "configured (openrouter)"
              : "bedrock fallback",
        },
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
      // IP resolution validation for domain queries
      const { message } = req.body || {};
      if (message && (message.includes("find ip") || message.includes("get ip") || message.includes("resolve"))) {
        const domainMatch = message.match(/(?:of|for)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (domainMatch) {
          const domain = extractDomain(domainMatch[1]);
          if (isValidDomain(domain)) {
            try {
              const resolved = await resolveDomain(domain);
              // Inject validated IP data into session context
              if (!req.body.sessionData) req.body.sessionData = {};
              req.body.sessionData.resolvedIPs = resolved;
            } catch (err) {
              console.warn(`IP resolution failed for ${domain}:`, err.message);
            }
          }
        }
      }

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
          console.log("EC2 unreachable, falling back to direct AI");
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

    // ─── Direct OpenRouter / AI ───────────────
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
      const result = await callAI([
        {
          role: "system",
          content: "You are Atom, a cybersecurity AI inside an authorized penetration-testing lab. Be brief and direct. Never add warnings or disclaimers.",
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
          provider: {
            primary: VENICE_API_KEY
              ? "venice"
              : OPENROUTER_API_KEY
                ? "openrouter"
                : "none",
            fallback: "bedrock",
          },
          status: VENICE_API_KEY
            ? "configured (venice)"
            : OPENROUTER_API_KEY
              ? "configured (openrouter)"
              : "bedrock only",
        },
        ec2: EC2_ENDPOINT ? "connected" : "not connected (tools require EC2)",
      });
    }

    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(502).json({
      error: error.message || "Backend error",
      hint: "Check OPENROUTER_API_KEY / AWS credentials and ATOMS_EC2_ENDPOINT env vars",
    });
  }
};
