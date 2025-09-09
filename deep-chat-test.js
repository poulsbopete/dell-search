// deep-chat-test.js - Comprehensive test for 1Chat APIs
const fetch = require('node-fetch').default || require('node-fetch');

const ELASTIC_CONFIG = {
    host: 'https://ai-assistants-ffcafb.kb.us-east-1.aws.elastic.cloud',
    apiKey: 'aGdDR0RKa0JETUNGNlpRbkRHVDY6T0VyTFcyUVN4VWxyaEQyZ00yMnk3QQ=='
};

async function testWithDifferentAuth(path, method = 'GET', body = null) {
    const url = `${ELASTIC_CONFIG.host}${path}`;
    console.log(`\n🔍 Testing: ${method} ${path}`);
    
    // Test different authentication methods
    const authMethods = [
        { name: 'ApiKey', headers: { 'Authorization': `ApiKey ${ELASTIC_CONFIG.apiKey}`, 'kbn-xsrf': 'true' }},
        { name: 'Bearer', headers: { 'Authorization': `Bearer ${ELASTIC_CONFIG.apiKey}`, 'kbn-xsrf': 'true' }},
        { name: 'Basic', headers: { 'Authorization': `Basic ${ELASTIC_CONFIG.apiKey}`, 'kbn-xsrf': 'true' }},
        { name: 'No Auth', headers: { 'kbn-xsrf': 'true' }}
    ];
    
    for (const auth of authMethods) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.headers
                }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(url, options);
            const status = response.status;
            
            console.log(`  ${auth.name}: ${status}`);
            
            if (status === 200) {
                console.log(`    ✅ SUCCESS with ${auth.name}!`);
                const data = await response.text();
                console.log(`    Response: ${data.substring(0, 200)}...`);
                return true; // Found working auth
            } else if (status === 401) {
                console.log(`    🔐 Auth required`);
            } else if (status === 403) {
                console.log(`    ❌ Forbidden`);
            } else if (status === 400) {
                const error = await response.text();
                if (!error.includes('no handler found')) {
                    console.log(`    ⚠️ Different error: ${error}`);
                }
            }
        } catch (error) {
            console.log(`    💥 ${auth.name} error: ${error.message}`);
        }
    }
    return false;
}

async function testChatEndpoints() {
    console.log('🤖 DEEP 1CHAT API TESTING');
    console.log('=' .repeat(50));
    
    // Test chat endpoints with different auth methods
    const chatEndpoints = [
        '/api/chat/tools',
        '/api/chat/agents',
        '/internal/chat/tools',
        '/internal/chat/agents'
    ];
    
    for (const endpoint of chatEndpoints) {
        const success = await testWithDifferentAuth(endpoint);
        if (success) {
            console.log(`🎯 Found working endpoint: ${endpoint}`);
            break;
        }
    }
    
    // Test POST endpoints
    console.log('\n💬 TESTING POST ENDPOINTS');
    const postEndpoints = [
        '/api/chat/converse',
        '/internal/chat/converse'
    ];
    
    const testBody = { input: "hello" };
    
    for (const endpoint of postEndpoints) {
        const success = await testWithDifferentAuth(endpoint, 'POST', testBody);
        if (success) {
            console.log(`🎯 Found working POST endpoint: ${endpoint}`);
            break;
        }
    }
    
    // Test if there's a different base path
    console.log('\n🔍 TESTING ALTERNATIVE BASE PATHS');
    const altPaths = [
        '/app/elasticsearch/api/chat/tools',
        '/kibana/api/chat/tools',
        '/elastic/api/chat/tools'
    ];
    
    for (const path of altPaths) {
        await testWithDifferentAuth(path);
    }
    
    console.log('\n🎯 TESTING COMPLETE');
}

// Test if we can find any working endpoint patterns
async function testEndpointPatterns() {
    console.log('\n🕵️ SEARCHING FOR ENDPOINT PATTERNS');
    
    // Try to find any /api/ endpoints that work
    const testPaths = [
        '/api',
        '/api/features',
        '/api/status',
        '/api/spaces/_active_space',
        '/api/security/me'
    ];
    
    for (const path of testPaths) {
        await testWithDifferentAuth(path);
    }
}

async function runDeepTest() {
    await testChatEndpoints();
    await testEndpointPatterns();
}

runDeepTest().catch(console.error);