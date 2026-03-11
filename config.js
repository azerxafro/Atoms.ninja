// Atoms Ninja - Configuration (Dynamic)
const CONFIG = {
  // Dynamic Backend API — uses the current origin so both www and beta work
  BACKEND_API_URL:
    (typeof window !== "undefined" ? window.location.origin : "") + "/api",

  // Kali Linux MCP Server — uses the current origin proxy
  KALI_MCP_ENDPOINT:
    (typeof window !== "undefined" ? window.location.origin : "") + "/api/kali",

  // Beta Mode detection
  IS_BETA:
    typeof window !== "undefined" &&
    window.location.hostname === "beta.atoms.ninja",
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
