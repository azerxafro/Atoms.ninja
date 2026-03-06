// Basic tests for Atoms Ninja Backend
const http = require('http');

async function testHealthCheck() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3001/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✓ Health check passed');
                    resolve(true);
                } else {
                    console.log('✗ Health check failed');
                    reject(false);
                }
            });
        }).on('error', reject);
    });
}

async function testGeminiEndpoint() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            prompt: 'Say hello',
            temperature: 0.8,
            maxTokens: 50
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/gemini',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✓ Gemini endpoint working');
                    resolve(true);
                } else {
                    console.log('✗ Gemini endpoint failed:', res.statusCode);
                    reject(false);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Running Atoms Ninja Backend Tests...\n');
    
    try {
        await testHealthCheck();
        await testGeminiEndpoint();
        console.log('\n✅ All tests passed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Tests failed:', error.message);
        process.exit(1);
    }
}

// Run tests if server is running
setTimeout(runTests, 1000);
