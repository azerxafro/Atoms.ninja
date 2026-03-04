// GitHub Copilot CLI Integration
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, previousOutput } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log(`🤖 Asking GitHub Copilot: ${query}`);
        
        // Build context-aware prompt
        let copilotPrompt = query;
        if (previousOutput) {
            copilotPrompt = `Previous command output: ${previousOutput.substring(0, 200)}. ${query}`;
        }
        
        // Call GitHub Copilot CLI via SSH to GCP VM
        const command = `ssh -o StrictHostKeyChecking=no root@136.113.58.241 "gh copilot suggest '${copilotPrompt.replace(/'/g, "'\\''")}' --target shell"`;
        
        const { stdout, stderr } = await execPromise(command, {
            timeout: 30000,
            maxBuffer: 1024 * 1024
        });
        
        // Parse Copilot's response
        const suggestion = parseCopilotOutput(stdout);
        
        if (!suggestion) {
            return res.status(500).json({ 
                error: 'Could not parse Copilot response',
                raw: stdout
            });
        }
        
        console.log(`✅ Copilot suggests: ${suggestion.command}`);
        
        res.json({
            success: true,
            command: suggestion.command,
            explanation: suggestion.explanation || 'Suggested by GitHub Copilot',
            autoExecute: {
                action: 'execute',
                command: suggestion.command,
                explanation: suggestion.explanation || 'Copilot suggestion'
            }
        });
        
    } catch (error) {
        console.error('GitHub Copilot Error:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stderr || error.stdout
        });
    }
};

function parseCopilotOutput(output) {
    // Parse GitHub Copilot CLI output format
    // Format is usually:
    // Suggestion:
    // 
    //   command here
    // 
    // Explanation: ...
    
    try {
        const lines = output.split('\n');
        let command = '';
        let explanation = '';
        let inCommand = false;
        let inExplanation = false;
        
        for (const line of lines) {
            if (line.includes('Suggestion:')) {
                inCommand = true;
                continue;
            }
            if (line.includes('Explanation:')) {
                inCommand = false;
                inExplanation = true;
                explanation = line.replace('Explanation:', '').trim();
                continue;
            }
            
            if (inCommand && line.trim()) {
                command = line.trim();
            }
            if (inExplanation && line.trim()) {
                explanation += ' ' + line.trim();
            }
        }
        
        // Fallback: extract any command-like string
        if (!command) {
            const match = output.match(/(?:nmap|nikto|sqlmap|dirb|hydra|metasploit|wireshark|tcpdump|whatweb)[^\n]+/i);
            if (match) {
                command = match[0].trim();
            }
        }
        
        return command ? { command, explanation } : null;
    } catch (e) {
        console.error('Parse error:', e);
        return null;
    }
}
