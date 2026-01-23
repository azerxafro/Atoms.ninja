/**
 * Shared Configuration
 * 
 * Constants used by both frontend and backend to ensure consistency
 */

// Keywords that indicate user is requesting a task/command
// These trigger the switch from nerdy mode to action mode
const TASK_KEYWORDS = [
    'scan', 'hack', 'exploit', 'find', 'check', 'test', 'analyze', 'detect',
    'nmap', 'metasploit', 'sqlmap', 'nikto', 'wireshark', 'burp',
    'vulnerability', 'vuln', 'penetration', 'pentest', 'security audit',
    'what os', 'what services', 'open ports', 'brute force'
];

// Export for Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TASK_KEYWORDS
    };
}

// Export for browser (frontend)
if (typeof window !== 'undefined') {
    window.SHARED_CONFIG = {
        TASK_KEYWORDS
    };
}
