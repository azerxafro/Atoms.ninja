// Atoms Ninja Configuration
// Replace with your actual API keys

const AtomsNinjaConfig = {
    // Google Gemini AI Configuration
    gemini: {
        apiKey: '', // DO NOT SET HERE - API key is managed by backend proxy server
        model: 'gemini-pro',
        endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
    },
    
    // Kali Linux MCP Server Configuration
    kaliMCP: {
        endpoint: 'http://136.113.58.241:3001',
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
    window.configureGeminiAPI = function(apiKey) {
        AtomsNinjaConfig.gemini.apiKey = apiKey;
        if (typeof CONFIG !== 'undefined') {
            CONFIG.GEMINI_API_KEY = apiKey;
        }
        console.log('%c✓ Gemini API configured!', 'color: #10B981; font-weight: bold;');
    };
}
