// Atoms Ninja - Configuration
const CONFIG = {
    // Backend API (Gemini Proxy) - Always use www.atoms.ninja
    BACKEND_API_URL: 'https://www.atoms.ninja/api',
    
    // Kali Linux MCP Server (GCP VM) - Always use www.atoms.ninja proxy
    KALI_MCP_ENDPOINT: 'https://www.atoms.ninja/api/kali',
    
    // GCP Configuration
    GCP: {
        PROJECT_ID: 'gen-lang-client-0528385692',
        VM_INSTANCE: 'atoms-kali-security',
        VM_IP: '136.113.58.241',
        REGION: 'us-central1'
    },
    
    // Service Accounts
    SERVICE_ACCOUNTS: {
        VERTEX_AI: 'gen-lang-client-0528385692-a54ea848daea.json',
        OWNER: 'gen-lang-client-0528385692-8f8d2551426e.json'
    },
    
    // API Keys
    GEMINI_API_KEY: 'd654e256baead3eaad49d56fded4718c3b4be7a9'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
