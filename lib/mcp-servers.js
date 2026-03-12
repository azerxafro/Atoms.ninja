/**
 * MCP Server Registry and Integration Module
 * Manages connections to Top Free & Open-Source MCP Servers
 *
 * Supported MCPs:
 * - Brave Search MCP: Real-time internet search
 * - Bright Data Web MCP: Web scraping
 * - Supabase MCP: PostgreSQL database
 * - GitHub MCP: Repository analysis
 * - Filesystem MCP: Local file access
 * - Firecrawl MCP: Batch web scraping
 * - Google Calendar/Drive MCP
 * - Weather MCP
 * - OKX MCP: Crypto price feeds
 * - Security MCPs: K-MCP, SSH-MCP, AWS-Postgres-MCP, MCP-ZAP
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

// Detect Docker environment
const IS_DOCKER = process.env.ATOMS_DOCKER === "true";

// MCP Server Registry
const MCP_REGISTRY = {
  // Search & Data
  "brave-search": {
    name: "Brave Search MCP",
    description: "Real-time internet search capability",
    endpoint:
      process.env.BRAVE_SEARCH_ENDPOINT || "https://search.brave.com/api/mcp",
    apiKey: process.env.BRAVE_SEARCH_API_KEY,
    rateLimit: 1, // 1 request per second
    enabled: !!process.env.BRAVE_SEARCH_API_KEY,
  },

  "bright-data": {
    name: "Bright Data Web MCP",
    description: "Scrape and parse JavaScript-heavy websites",
    endpoint: process.env.BRIGHT_DATA_ENDPOINT,
    zone: process.env.BRIGHT_DATA_ZONE,
    password: process.env.BRIGHT_DATA_PASSWORD,
    enabled: !!(
      process.env.BRIGHT_DATA_ENDPOINT && process.env.BRIGHT_DATA_ZONE
    ),
  },

  supabase: {
    name: "Supabase MCP",
    description: "PostgreSQL database access",
    endpoint: process.env.SUPABASE_ENDPOINT,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    enabled: !!process.env.SUPABASE_ENDPOINT,
  },

  github: {
    name: "GitHub MCP",
    description: "Repository analysis and management",
    endpoint: "https://api.github.com/graphql",
    token: process.env.GITHUB_TOKEN,
    enabled: !!process.env.GITHUB_TOKEN,
  },

  firecrawl: {
    name: "Firecrawl MCP",
    description: "Batch web scraping and data extraction",
    endpoint: process.env.FIRECRAWL_ENDPOINT || "https://api.firecrawl.dev",
    apiKey: process.env.FIRECRAWL_API_KEY,
    enabled: !!process.env.FIRECRAWL_API_KEY,
  },

  google: {
    name: "Google Calendar/Drive MCP",
    description: "Access schedules and files",
    credentials: process.env.GOOGLE_CREDENTIALS,
    enabled: !!process.env.GOOGLE_CREDENTIALS,
  },

  weather: {
    name: "Weather MCP",
    description: "Real-time weather data",
    endpoint: "https://api.open-meteo.com/v1/forecast",
    enabled: true,
  },

  okx: {
    name: "OKX MCP Server",
    description: "Real-time crypto price feeds",
    endpoint: "https://www.okx.com/api/v5/market",
    enabled: true,
  },

  // Security MCPs
  "k-mcp": {
    name: "K-MCP Security",
    description: "Security research tools",
    repo: "https://github.com/Stoicmehedi/K-MCP",
    endpoint: process.env.K_MCP_ENDPOINT,
    enabled: !!process.env.K_MCP_ENDPOINT,
  },

  "ssh-mcp": {
    name: "SSH MCP",
    description: "SSH connection management",
    repo: "https://github.com/tufantunc/ssh-mcp",
    endpoint: process.env.SSH_MCP_ENDPOINT,
    enabled: !!process.env.SSH_MCP_ENDPOINT,
  },

  "aws-postgres-mcp": {
    name: "AWS Postgres MCP",
    description: "AWS PostgreSQL database access",
    repo: "https://github.com/T1nker-1220/aws-postgress-mcp-server",
    endpoint: process.env.AWS_PG_MCP_ENDPOINT,
    enabled: !!process.env.AWS_PG_MCP_ENDPOINT,
  },

  "mcp-zap": {
    name: "MCP ZAP Server",
    description: "OWASP ZAP security scanning",
    repo: "https://github.com/dtkmn/mcp-zap-server",
    endpoint: process.env.ZAP_MCP_ENDPOINT || (IS_DOCKER ? "http://localhost:8080" : undefined),
    enabled: !!(process.env.ZAP_MCP_ENDPOINT || IS_DOCKER),
  },

  "mcp-experiments": {
    name: "MCP Experiments",
    description: "Various experimental MCP tools",
    repo: "https://github.com/jordanperr/mcp-experiments",
  },
};

// Rate limiting storage
const rateLimitStore = new Map();

class MCPServerManager {
  constructor() {
    this.servers = new Map();
    this.initializeServers();
  }

  initializeServers() {
    for (const [key, config] of Object.entries(MCP_REGISTRY)) {
      this.servers.set(key, {
        ...config,
        lastRequest: 0,
        requestCount: 0,
        status: config.enabled ? "ready" : "disabled",
      });
    }
  }

  // Check rate limit
  checkRateLimit(serverKey, limit) {
    const now = Date.now();
    const server = this.servers.get(serverKey);

    if (!server) return false;

    const timeSinceLastRequest = now - server.lastRequest;
    const minInterval = 1000 / limit;

    if (timeSinceLastRequest < minInterval) {
      return false;
    }

    server.lastRequest = now;
    return true;
  }

  // Get enabled servers
  getEnabledServers() {
    const enabled = [];
    for (const [key, server] of this.servers) {
      if (server.enabled) {
        enabled.push({ key, ...server });
      }
    }
    return enabled;
  }

  // Execute MCP request
  async executeRequest(serverKey, params = {}) {
    const server = this.servers.get(serverKey);

    if (!server || !server.enabled) {
      throw new Error(`MCP server ${serverKey} is not enabled`);
    }

    if (!this.checkRateLimit(serverKey, server.rateLimit || 1)) {
      throw new Error(`Rate limit exceeded for ${serverKey}`);
    }

    try {
      switch (serverKey) {
        case "brave-search":
          return await this.braveSearch(params.query);
        case "weather":
          return await this.getWeather(params.lat, params.lon);
        case "okx":
          return await this.getCryptoPrice(params.symbol);
        case "github":
          return await this.githubQuery(params.query);
        case "firecrawl":
          return await this.firecrawl(params.url, params.options);
        case "supabase":
          return await this.supabaseQuery(params);
        case "mcp-zap":
          return await this.zapScan(params.target, params.scanType);
        default:
          return { error: "Unknown server" };
      }
    } catch (error) {
      console.error(`MCP ${serverKey} error:`, error.message);
      throw error;
    }
  }

  // Brave Search implementation
  async braveSearch(query) {
    const server = this.servers.get("brave-search");
    const url = new URL("https://search.brave.com/api/mcp");
    url.searchParams.set("q", query);

    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            Accept: "application/json",
            "X-Subscription-Token": server.apiKey || "",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ raw: data });
            }
          });
        },
      );
      req.on("error", reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    });
  }

  // Weather API
  async getWeather(lat = 40.7128, lon = -74.006) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lon);
    url.searchParams.set(
      "current",
      "temperature_2m,weather_code,wind_speed_10m",
    );
    url.searchParams.set("timezone", "auto");

    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(JSON.parse(data)));
        })
        .on("error", reject);
    });
  }

  // OKX Crypto prices
  async getCryptoPrice(symbol = "BTC-USDT") {
    const url = new URL("https://www.okx.com/api/v5/market/ticker");
    url.searchParams.set("instId", symbol);

    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.data && parsed.data[0]) {
                resolve({
                  symbol,
                  price: parsed.data[0].last,
                  change24h: parsed.data[0].sodUtc0,
                  volume24h: parsed.data[0].vol24h,
                });
              } else {
                resolve(parsed);
              }
            } catch (e) {
              resolve({ raw: data });
            }
          });
        })
        .on("error", reject);
    });
  }

  // GitHub GraphQL
  async githubQuery(query) {
    const server = this.servers.get("github");

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ query });
      const url = new URL("https://api.github.com/graphql");

      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          Authorization: `Bearer ${server.token}`,
          Accept: "application/json",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
      });

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  // Firecrawl
  async firecrawl(url, options = {}) {
    const server = this.servers.get("firecrawl");
    const apiUrl = `${server.endpoint}/v1/scrape`;

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ url, ...options });

      const urlObj = new URL(apiUrl);
      const optionsObj = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          Authorization: `Bearer ${server.apiKey}`,
        },
      };

      const req = https.request(optionsObj, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        });
      });

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  // Supabase query
  async supabaseQuery(params) {
    const server = this.servers.get("supabase");
    const { table, method = "select", data } = params;

    const url = new URL(`${server.endpoint}/rest/v1/${table}`);
    url.searchParams.set("select", "*");

    return new Promise((resolve, reject) => {
      const options = {
        hostname: new URL(server.endpoint).hostname,
        path: url.pathname + url.search,
        method: method === "insert" ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: server.anonKey,
          Authorization: `Bearer ${server.serviceKey || server.anonKey}`,
        },
      };

      const req = http.request(options, (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve({ raw: responseData });
          }
        });
      });

      req.on("error", reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  // OWASP ZAP scan — real execution via ZAP API
  async zapScan(target, scanType = "spider") {
    const server = this.servers.get("mcp-zap");
    if (!server || !server.enabled) {
      throw new Error("ZAP MCP is not enabled");
    }

    const baseUrl = server.endpoint;

    // Start ZAP daemon if not running (Docker only)
    if (IS_DOCKER) {
      await this._ensureZapRunning(baseUrl);
    }

    const actions = {
      spider: `/JSON/spider/action/scan/?url=${encodeURIComponent(target)}`,
      active: `/JSON/ascan/action/scan/?url=${encodeURIComponent(target)}`,
      passive: `/JSON/pscan/view/recordsToScan/`,
      alerts: `/JSON/alert/view/alerts/?baseurl=${encodeURIComponent(target)}&start=0&count=100`,
    };

    const apiPath = actions[scanType] || actions.spider;

    return new Promise((resolve, reject) => {
      const url = new URL(`${baseUrl}${apiPath}`);

      http
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ raw: data });
            }
          });
        })
        .on("error", reject);
    });
  }

  // Ensure ZAP daemon is running (starts on-demand to save RAM)
  async _ensureZapRunning(baseUrl) {
    try {
      await new Promise((resolve, reject) => {
        http
          .get(`${baseUrl}/JSON/core/view/version/`, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve(data));
          })
          .on("error", reject);
      });
    } catch {
      // ZAP not running — start it
      const { spawn } = require("child_process");
      const zap = spawn("zap.sh", ["-daemon", "-port", "8080", "-config", "api.disablekey=true"], {
        detached: true,
        stdio: "ignore",
      });
      zap.unref();
      // Wait for ZAP to boot (takes ~10-15s)
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          await new Promise((resolve, reject) => {
            http
              .get(`${baseUrl}/JSON/core/view/version/`, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => resolve(data));
              })
              .on("error", reject);
          });
          break;
        } catch {
          // Still starting
        }
      }
    }
  }

  // Get server status
  getStatus() {
    const status = {};
    for (const [key, server] of this.servers) {
      status[key] = {
        name: server.name,
        enabled: server.enabled,
        status: server.status,
        rateLimit: server.rateLimit,
      };
    }
    return status;
  }
}

// Export singleton
module.exports = new MCPServerManager();
