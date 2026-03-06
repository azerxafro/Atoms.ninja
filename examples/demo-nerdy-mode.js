#!/usr/bin/env node
/**
 * Demo Script - Shows Nerdy Personality Mode Behavior
 * 
 * This script demonstrates the expected behavior of the nerdy personality mode
 * without requiring a running backend server.
 */

console.log('\n═══════════════════════════════════════════════════════');
console.log('🤖 Atoms Ninja - Nerdy Personality Mode Demo');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📋 This demo shows how the AI personality changes based on user input.\n');

// Load shared config
const { TASK_KEYWORDS } = require('./shared-config.js');

console.log(`✅ Loaded ${TASK_KEYWORDS.length} task keywords for detection\n`);

// Simulate conversation states
let conversationMode = 'nerdy';

// Test messages
const conversations = [
    {
        user: "hi",
        description: "Initial greeting"
    },
    {
        user: "how are you?",
        description: "Casual question"
    },
    {
        user: "what can you do?",
        description: "Capabilities question"
    },
    {
        user: "scan 192.168.1.1",
        description: "Task request - should trigger mode switch"
    },
    {
        user: "find vulnerabilities on example.com",
        description: "Another task - stays in action mode"
    }
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

conversations.forEach((conv, index) => {
    console.log(`${index + 1}. User: "${conv.user}"`);
    console.log(`   Description: ${conv.description}`);
    
    // Detect if it's a task request
    const isTaskRequest = TASK_KEYWORDS.some(kw => 
        conv.user.toLowerCase().includes(kw.toLowerCase())
    );
    
    console.log(`   Is Task Request: ${isTaskRequest ? 'YES ✅' : 'NO'}`);
    
    // Check mode transition
    const previousMode = conversationMode;
    if (conversationMode === 'nerdy' && isTaskRequest) {
        conversationMode = 'action';
        console.log(`   🔄 MODE SWITCH: "${previousMode}" → "${conversationMode}"`);
        console.log('   💬 System Message: "⚡ Switching to ACTION MODE - Initializing MCP server..."');
    } else {
        console.log(`   Mode: ${conversationMode} (no change)`);
    }
    
    // Show expected personality
    if (conversationMode === 'nerdy') {
        console.log('   🤓 Expected Response Style: Nerdy, enthusiastic, uses emojis');
        console.log('   📝 Example: "Greetings, fellow human! 👋 Atom at your service..."');
    } else {
        console.log('   ⚡ Expected Response Style: Professional, executes command');
        console.log('   📝 Example: {"action":"execute","command":"nmap -sV 192.168.1.1",...}');
    }
    
    console.log();
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📊 Summary:');
console.log('   • Initial mode: nerdy (enthusiastic personality)');
console.log('   • Trigger: Any message containing task keywords');
console.log('   • Final mode: action (professional, executes commands)');
console.log('   • Mode persists throughout session\n');

console.log('✅ Demo completed successfully!\n');

console.log('═══════════════════════════════════════════════════════\n');
