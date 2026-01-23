#!/usr/bin/env node
/**
 * Comprehensive Test Suite for API Key and MCP Server
 * Tests that both the Gemini API and Kali MCP server are working
 * and can handle user-provided tasks
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const fetch = require('node-fetch');

// Test Configuration
const BACKEND_PORT = process.env.PORT || 3001;
const KALI_MCP_PORT = process.env.KALI_MCP_PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'd654e256baead3eaad49d56fded4718c3b4be7a9';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Validate API Key Configuration
async function testApiKeyConfiguration() {
    log('\n📋 Test 1: API Key Configuration', 'cyan');
    
    if (!GEMINI_API_KEY) {
        log('✗ FAILED: No API key found in environment', 'red');
        return false;
    }
    
    log(`✓ API key found: ${GEMINI_API_KEY.substring(0, 10)}...`, 'green');
    return true;
}

// Test 2: Test Direct Gemini API Access
async function testGeminiApiDirect() {
    log('\n🔑 Test 2: Direct Gemini API Access', 'cyan');
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Say "API test successful" in exactly those words.'
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 50
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            log(`✗ FAILED: Gemini API returned ${response.status}`, 'red');
            log(`Error: ${JSON.stringify(error, null, 2)}`, 'red');
            return false;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
            const text = data.candidates[0].content.parts[0].text;
            log(`✓ Gemini API responds: ${text.substring(0, 100)}`, 'green');
            return true;
        } else {
            log('✗ FAILED: Unexpected response format', 'red');
            return false;
        }
    } catch (error) {
        log(`✗ FAILED: ${error.message}`, 'red');
        return false;
    }
}

// Test 3: Test Backend Proxy Health
async function testBackendHealth() {
    log('\n🏥 Test 3: Backend Proxy Health Check', 'cyan');
    
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        log(`✓ Backend is healthy: ${json.service}`, 'green');
                        resolve(true);
                    } catch (e) {
                        log('✗ FAILED: Invalid JSON response', 'red');
                        resolve(false);
                    }
                } else {
                    log(`✗ FAILED: Backend returned ${res.statusCode}`, 'red');
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            log(`✗ FAILED: Backend not reachable - ${err.message}`, 'red');
            log('  Make sure to start the backend with: npm start', 'yellow');
            resolve(false);
        });
    });
}

// Test 4: Test Backend Gemini Proxy
async function testBackendGeminiProxy() {
    log('\n🔄 Test 4: Backend Gemini Proxy', 'cyan');
    
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            prompt: 'You are a cybersecurity expert. Respond with "Security test passed" and nothing else.',
            temperature: 0.1,
            maxTokens: 50
        });

        const options = {
            hostname: 'localhost',
            port: BACKEND_PORT,
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
                    try {
                        const json = JSON.parse(data);
                        if (json.candidates && json.candidates[0]) {
                            const text = json.candidates[0].content.parts[0].text;
                            log(`✓ Backend proxy working: ${text.substring(0, 100)}`, 'green');
                            resolve(true);
                        } else {
                            log('✗ FAILED: Unexpected response structure', 'red');
                            resolve(false);
                        }
                    } catch (e) {
                        log(`✗ FAILED: Invalid JSON - ${e.message}`, 'red');
                        resolve(false);
                    }
                } else {
                    log(`✗ FAILED: Backend proxy returned ${res.statusCode}`, 'red');
                    log(`Response: ${data}`, 'red');
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            log(`✗ FAILED: ${err.message}`, 'red');
            resolve(false);
        });
        
        req.write(postData);
        req.end();
    });
}

// Test 5: Test MCP Server Health
async function testMcpServerHealth() {
    log('\n🛡️  Test 5: MCP Server Health Check', 'cyan');
    
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${KALI_MCP_PORT}/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        log(`✓ MCP Server is healthy: ${json.service}`, 'green');
                        resolve(true);
                    } catch (e) {
                        log('✗ FAILED: Invalid JSON response', 'red');
                        resolve(false);
                    }
                } else {
                    log(`✗ FAILED: MCP Server returned ${res.statusCode}`, 'red');
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            log(`✗ FAILED: MCP Server not reachable - ${err.message}`, 'red');
            log('  Make sure to start MCP server with: node kali-mcp-server.js', 'yellow');
            resolve(false);
        });
    });
}

// Test 6: Test MCP Tools List
async function testMcpToolsList() {
    log('\n🔧 Test 6: MCP Tools Availability', 'cyan');
    
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${KALI_MCP_PORT}/api/tools`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        if (json.categories) {
                            log(`✓ MCP Tools available:`, 'green');
                            Object.keys(json.categories).forEach(category => {
                                log(`  - ${category}: ${json.categories[category].length} tools`, 'green');
                            });
                            resolve(true);
                        } else {
                            log('✗ FAILED: No categories in response', 'red');
                            resolve(false);
                        }
                    } catch (e) {
                        log(`✗ FAILED: Invalid JSON - ${e.message}`, 'red');
                        resolve(false);
                    }
                } else {
                    log(`✗ FAILED: MCP tools endpoint returned ${res.statusCode}`, 'red');
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            log(`✗ FAILED: ${err.message}`, 'red');
            resolve(false);
        });
    });
}

// Test 7: Test User Task Execution (Simulated)
async function testUserTaskExecution() {
    log('\n👤 Test 7: User Task Execution', 'cyan');
    
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            prompt: 'As a cybersecurity expert, explain what nmap is used for in 2 sentences.',
            temperature: 0.7,
            maxTokens: 100
        });

        const options = {
            hostname: 'localhost',
            port: BACKEND_PORT,
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
                    try {
                        const json = JSON.parse(data);
                        if (json.candidates && json.candidates[0]) {
                            const text = json.candidates[0].content.parts[0].text;
                            log(`✓ User task executed successfully`, 'green');
                            log(`  AI Response: ${text.substring(0, 150)}...`, 'blue');
                            resolve(true);
                        } else {
                            log('✗ FAILED: No response from AI', 'red');
                            resolve(false);
                        }
                    } catch (e) {
                        log(`✗ FAILED: ${e.message}`, 'red');
                        resolve(false);
                    }
                } else {
                    log(`✗ FAILED: Task execution returned ${res.statusCode}`, 'red');
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            log(`✗ FAILED: ${err.message}`, 'red');
            resolve(false);
        });
        
        req.write(postData);
        req.end();
    });
}

// Test 8: Test MCP Command Execution (Safe command)
async function testMcpCommandExecution() {
    log('\n⚡ Test 8: MCP Command Execution', 'cyan');
    
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            command: 'whois',
            args: ['example.com']
        });

        const options = {
            hostname: 'localhost',
            port: KALI_MCP_PORT,
            path: '/api/execute',
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
                    try {
                        const json = JSON.parse(data);
                        if (json.result || json.stderr) {
                            log(`✓ MCP command executed successfully`, 'green');
                            log(`  Result preview: ${(json.result || json.stderr).substring(0, 100)}...`, 'blue');
                            resolve(true);
                        } else {
                            log('✗ FAILED: No result from command', 'red');
                            resolve(false);
                        }
                    } catch (e) {
                        log(`✗ FAILED: ${e.message}`, 'red');
                        resolve(false);
                    }
                } else {
                    log(`✗ FAILED: Command execution returned ${res.statusCode}`, 'red');
                    log(`Response: ${data}`, 'red');
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            log(`✗ FAILED: ${err.message}`, 'red');
            resolve(false);
        });
        
        req.write(postData);
        req.end();
    });
}

// Main test runner
async function runAllTests() {
    log('\n' + '='.repeat(60), 'cyan');
    log('🧪 Atoms Ninja - Comprehensive API & MCP Test Suite', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const results = [];
    
    // Run tests sequentially
    results.push({ name: 'API Key Configuration', passed: await testApiKeyConfiguration() });
    results.push({ name: 'Direct Gemini API Access', passed: await testGeminiApiDirect() });
    results.push({ name: 'Backend Health Check', passed: await testBackendHealth() });
    results.push({ name: 'Backend Gemini Proxy', passed: await testBackendGeminiProxy() });
    results.push({ name: 'MCP Server Health', passed: await testMcpServerHealth() });
    results.push({ name: 'MCP Tools List', passed: await testMcpToolsList() });
    results.push({ name: 'User Task Execution', passed: await testUserTaskExecution() });
    results.push({ name: 'MCP Command Execution', passed: await testMcpCommandExecution() });
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 Test Results Summary', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
        const icon = result.passed ? '✓' : '✗';
        const color = result.passed ? 'green' : 'red';
        log(`${icon} ${result.name}`, color);
    });
    
    log('\n' + '-'.repeat(60), 'cyan');
    log(`Total: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
    log('-'.repeat(60) + '\n', 'cyan');
    
    if (passed === total) {
        log('🎉 All tests passed! System is fully operational.', 'green');
        process.exit(0);
    } else {
        log('⚠️  Some tests failed. Please check the output above.', 'yellow');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(err => {
    log(`\n❌ Test suite error: ${err.message}`, 'red');
    process.exit(1);
});
