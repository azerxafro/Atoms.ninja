/**
 * lib/ip-resolver.js — Consistent IP resolution and validation
 * Ensures accurate DNS resolution across all AI providers
 */

const { spawn } = require("child_process");

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
 * Execute command and return stdout
 */
function execCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false });
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Command timeout: ${command}`));
    }, 10000);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed: ${command} (exit ${code})`));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
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
