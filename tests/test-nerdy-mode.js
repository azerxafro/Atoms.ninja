#!/usr/bin/env node
/**
 * Test script for nerdy personality mode
 * Tests that AI responds with nerdy personality for casual chat
 * and switches to action mode for task requests
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/multi-ai';

// Test cases
const tests = [
    {
        name: 'Casual greeting (should be nerdy)',
        message: 'hi',
        expectNerdy: true,
        expectJSON: false
    },
    {
        name: 'How are you (should be nerdy)',
        message: 'how are you?',
        expectNerdy: true,
        expectJSON: false
    },
    {
        name: 'What can you do (should be nerdy)',
        message: 'what can you do?',
        expectNerdy: true,
        expectJSON: false
    },
    {
        name: 'Scan request (should be action mode)',
        message: 'scan 192.168.1.1',
        expectNerdy: false,
        expectJSON: true
    },
    {
        name: 'Find vulnerabilities (should be action mode)',
        message: 'find vulnerabilities on example.com',
        expectNerdy: false,
        expectJSON: true
    }
];

async function runTest(test) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Message: "${test.message}"`);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: test.message,
                chatHistory: [],
                sessionData: {},
                mode: 'fast'
            })
        });

        if (!response.ok) {
            console.log(`   ❌ FAILED - HTTP ${response.status}`);
            return false;
        }

        const data = await response.json();
        const responseText = data.response || '';
        
        console.log(`   Response: "${responseText.substring(0, 100)}..."`);
        console.log(`   Provider: ${data.provider}`);
        
        // Check for nerdy indicators
        const nerdy_indicators = ['🤓', '!', 'fascinating', 'oh boy', 'greetings', 'fellow human', 
                                   'OMG', 'so cool', 'excited', '🚀', '💻', '⚡'];
        const hasNerdyStyle = nerdy_indicators.some(ind => 
            responseText.toLowerCase().includes(ind.toLowerCase())
        );
        
        // Check for action mode (JSON command)
        const isActionMode = data.autoExecute && data.autoExecute.action === 'execute';
        
        let passed = true;
        
        if (test.expectNerdy && !hasNerdyStyle) {
            console.log(`   ⚠️  Expected nerdy style but got: "${responseText.substring(0, 80)}"`);
            passed = false;
        }
        
        if (test.expectJSON && !isActionMode) {
            console.log(`   ⚠️  Expected action command but got regular response`);
            passed = false;
        }
        
        if (!test.expectJSON && isActionMode) {
            console.log(`   ⚠️  Got action command when expecting casual response`);
            passed = false;
        }
        
        if (passed) {
            console.log(`   ✅ PASSED`);
        } else {
            console.log(`   ❌ FAILED`);
        }
        
        return passed;
        
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🤖 Testing Nerdy Personality Mode');
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('\n⚠️  Make sure the backend server is running on port 3001!');
    console.log('   Run: npm start (in another terminal)\n');
    
    // Wait a bit for user to check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        const result = await runTest(test);
        if (result) passed++;
        else failed++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
