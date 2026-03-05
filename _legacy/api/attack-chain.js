// Smart Attack Chain Suggestions API
import fetch from 'node-fetch';

const ATTACK_CHAINS = {
    'Apache/2.4.6': [
        { step: 1, action: 'Verify CVE-2021-44790', command: 'curl -H "X-Forwarded-For: $(python -c \'print \"A\"*1000\')" TARGET', risk: 'HIGH' },
        { step: 2, action: 'Check for mod_lua', command: 'nmap --script http-methods TARGET', risk: 'MEDIUM' },
        { step: 3, action: 'Test directory traversal', command: 'dirb http://TARGET /usr/share/wordlists/dirb/common.txt', risk: 'MEDIUM' },
        { step: 4, action: 'Search Metasploit modules', command: 'msfconsole -x "search apache 2.4.6"', risk: 'HIGH' }
    ],
    'OpenSSL/1.0.2': [
        { step: 1, action: 'Test Heartbleed', command: 'nmap -p 443 --script ssl-heartbleed TARGET', risk: 'CRITICAL' },
        { step: 2, action: 'Check SSL/TLS config', command: 'sslscan TARGET:443', risk: 'LOW' },
        { step: 3, action: 'Test cipher weaknesses', command: 'nmap --script ssl-enum-ciphers -p 443 TARGET', risk: 'MEDIUM' }
    ],
    'PHP/7.4': [
        { step: 1, action: 'Check PHP info page', command: 'curl http://TARGET/phpinfo.php', risk: 'LOW' },
        { step: 2, action: 'Test file upload', command: 'Test manual file upload with PHP shell', risk: 'HIGH' },
        { step: 3, action: 'Check for RCE', command: 'Check for vulnerable functions (eval, system, exec)', risk: 'CRITICAL' }
    ],
    'SQL': [
        { step: 1, action: 'Basic SQL injection test', command: 'sqlmap -u "TARGET?id=1" --batch', risk: 'HIGH' },
        { step: 2, action: 'Database enumeration', command: 'sqlmap -u "TARGET?id=1" --dbs --batch', risk: 'HIGH' },
        { step: 3, action: 'Dump tables', command: 'sqlmap -u "TARGET?id=1" -D database --tables --batch', risk: 'HIGH' },
        { step: 4, action: 'Extract credentials', command: 'sqlmap -u "TARGET?id=1" -D database -T users --dump --batch', risk: 'CRITICAL' }
    ],
    'Web': [
        { step: 1, action: 'Technology detection', command: 'whatweb -v TARGET', risk: 'LOW' },
        { step: 2, action: 'Directory fuzzing', command: 'ffuf -u http://TARGET/FUZZ -w /usr/share/wordlists/dirb/common.txt', risk: 'MEDIUM' },
        { step: 3, action: 'Subdomain enumeration', command: 'sublist3r -d TARGET', risk: 'LOW' },
        { step: 4, action: 'Parameter fuzzing', command: 'wfuzz -u http://TARGET/page?FUZZ=test -w params.txt', risk: 'MEDIUM' }
    ]
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
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
        const { scanOutput, vulnerabilities, target } = req.body;
        
        console.log('🎯 Generating attack chain suggestions...');
        
        // Analyze scan output for attack vectors
        const chains = [];
        
        // Check for specific software
        for (const [software, chain] of Object.entries(ATTACK_CHAINS)) {
            if (scanOutput && scanOutput.includes(software.split('/')[0])) {
                chains.push({
                    target: software,
                    steps: chain.map(step => ({
                        ...step,
                        command: step.command.replace(/TARGET/g, target || 'TARGET')
                    }))
                });
            }
        }
        
        // Always include general web testing
        if (!chains.find(c => c.target === 'Web')) {
            chains.push({
                target: 'General Web Assessment',
                steps: ATTACK_CHAINS['Web'].map(step => ({
                    ...step,
                    command: step.command.replace(/TARGET/g, target || 'TARGET')
                }))
            });
        }
        
        // Use AI to generate custom attack chain
        let aiSuggestions = '';
        if (OPENAI_API_KEY && vulnerabilities && vulnerabilities.length > 0) {
            try {
                const prompt = `Given these vulnerabilities:\n${vulnerabilities.map(v => `- ${v.cve}: ${v.description}`).join('\n')}\n\nSuggest 3 specific attack steps in order. Be concise and technical.`;
                
                const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: 'You are a penetration testing expert. Suggest specific attack steps.' },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: 300
                    })
                });
                
                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    aiSuggestions = aiData.choices[0]?.message?.content || '';
                }
            } catch (aiError) {
                console.log('AI suggestions failed:', aiError.message);
            }
        }
        
        console.log(`✅ Generated ${chains.length} attack chains`);
        
        res.json({
            success: true,
            chains,
            aiSuggestions,
            summary: `Found ${chains.length} attack vectors. Start with highest risk steps.`
        });
        
    } catch (error) {
        console.error('Attack Chain Error:', error);
        res.status(500).json({ error: error.message });
    }
}
