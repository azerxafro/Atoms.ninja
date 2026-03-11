// Atoms Ninja Configuration
// Replace with your actual API keys

const AtomsNinjaConfig = {
    // AI Provider Configuration (managed by backend proxy — OpenRouter / Venice / Bedrock)
    ai: {
        apiKey: '', // DO NOT SET HERE - API key is managed by backend proxy server
        provider: 'openrouter'
    },
    
    // Kali Linux MCP Server Configuration (EC2 only)
    kaliMCP: {
        endpoint: 'http://localhost:3001', // Local dev → EC2 tunnel; production uses Vercel proxy
        timeout: 30000,
        maxRetries: 3
    },
    
    // Security Settings
    security: {
        enableLogging: true,
        maxCommandLength: 1000,
        commandTimeout: 60000,
        allowedCommands: [
            'nmap', 'scan', 'metasploit', 'msfconsole', 'wireshark',
            'burp', 'sqlmap', 'nikto', 'aircrack', 'hydra',
            'john', 'hashcat', 'forensic', 'autopsy', 'volatility'
        ]
    },
    
    // UI Settings
    ui: {
        theme: 'dark',
        terminalLines: 100,
        animationSpeed: 300
    }
};

// Initialize configuration
if (typeof window !== 'undefined') {
    window.AtomsNinjaConfig = AtomsNinjaConfig;
    
    // Helper function to set API key
    window.configureAI = function(apiKey) {
        AtomsNinjaConfig.ai.apiKey = apiKey;
        if (typeof CONFIG !== 'undefined') {
            CONFIG.AI_API_KEY = apiKey;
        }
        console.log('%c✓ AI API configured!', 'color: #10B981; font-weight: bold;');
    };
}
