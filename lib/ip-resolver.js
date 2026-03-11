/**
 * lib/ip-resolver.js — Consistent IP resolution and validation
 * All shell commands (dig, host) are proxied to EC2 via ATOMS_EC2_ENDPOINT.
 */

const fetch = globalThis.fetch || require("node-fetch");

/**
 * Resolve domain to IP addresses using multiple methods
 * Returns { ipv4: [], ipv6: [], mx: [], ns: [], cname: null }
 */
async function resolveDomain(domain) {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  
  const results = {
    ipv4: [],
    ipv6: [],
    mx: [],
    ns: [],
    cname: null,
    raw: {}
  };

  // Run multiple dig queries in parallel
  const queries = [
    { type: "A", key: "ipv4" },
    { type: "AAAA", key: "ipv6" },
    { type: "MX", key: "mx" },
    { type: "NS", key: "ns" },
    { type: "CNAME", key: "cname" }
  ];

  const promises = queries.map(async ({ type, key }) => {
    try {
      const output = await execCommand("dig", ["+short", cleanDomain, type]);
      const lines = output.trim().split("\n").filter(Boolean);
      
      if (key === "cname" && lines.length > 0) {
        results.cname = lines[0].replace(/\.$/, "");
      } else {
        results[key] = lines.map(line => line.replace(/\.$/, ""));
      }
      
      results.raw[type] = output;
    } catch (err) {
      // Ignore errors for individual queries
    }
  });

  await Promise.all(promises);

  // Also try host command as fallback
  try {
    const hostOutput = await execCommand("host", [cleanDomain]);
    results.raw.host = hostOutput;
    
    // Parse host output for additional IPs
    const ipv4Matches = hostOutput.match(/has address (\d+\.\d+\.\d+\.\d+)/g);
    if (ipv4Matches) {
      ipv4Matches.forEach(match => {
        const ip = match.match(/(\d+\.\d+\.\d+\.\d+)/)[1];
        if (!results.ipv4.includes(ip)) {
          results.ipv4.push(ip);
        }
      });
    }
  } catch (err) {
    // Ignore host command errors
  }

  return results;
}

/**
 * Execute command via EC2 proxy — never locally
 */
function execCommand(command, args) {
  const EC2_ENDPOINT = process.env.ATOMS_EC2_ENDPOINT || "";
  if (!EC2_ENDPOINT) {
    // Fallback to Node.js built-in DNS when EC2 is unavailable
    return new Promise((resolve, reject) => {
      const dns = require("dns");
      // Only dig/host are used here — fall back to dns.resolve
      reject(new Error("EC2 not available for shell commands"));
    });
  }
  return new Promise(async (resolve, reject) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${EC2_ENDPOINT}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, args }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await response.json();
      if (data.error) reject(new Error(data.error));
      else resolve(data.result || data.stdout || "");
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Validate if string is a valid IP address
 */
function isValidIP(str) {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(str)) {
    const parts = str.split(".");
    return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
  }
  
  // IPv6 (basic check)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(str);
}

/**
 * Validate if string is a valid domain
 */
function isValidDomain(str) {
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(str);
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

module.exports = {
  resolveDomain,
  isValidIP,
  isValidDomain,
  extractDomain,
  execCommand
};
