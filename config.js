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

  // GCP Configuration
  GCP: {
    PROJECT_ID: "gen-lang-client-0528385692",
    VM_INSTANCE: "atoms-kali-security",
    VM_IP: "136.113.58.241",
    REGION: "us-central1",
  },

  // Service Accounts
  SERVICE_ACCOUNTS: {
    VERTEX_AI: "gen-lang-client-0528385692-a54ea848daea.json",
    OWNER: "gen-lang-client-0528385692-8f8d2551426e.json",
  },
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
