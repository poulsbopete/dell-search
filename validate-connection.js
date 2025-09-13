#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testElasticsearchConnection() {
  console.log('🔍 Testing Elasticsearch Connection...\n');
  
  const url = process.env.ELASTICSEARCH_URL;
  const apiKey = process.env.ELASTICSEARCH_API_KEY;
  const index = process.env.ELASTICSEARCH_INDEX || 'search-dell';
  
  if (!url || !apiKey) {
    console.log('❌ Missing Elasticsearch configuration!');
    console.log('   Please run: node setup-env.js');
    return false;
  }
  
  console.log(`📡 Testing connection to: ${url}`);
  console.log(`📊 Index: ${index}`);
  
  try {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: `/${index}/_search`,
      method: 'GET',
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    return new Promise((resolve) => {
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const result = JSON.parse(data);
              console.log('✅ Elasticsearch connection successful!');
              console.log(`📈 Total documents in index: ${result.hits?.total?.value || result.hits?.total || 0}`);
              resolve(true);
            } catch (error) {
              console.log('⚠️  Connection successful but response format unexpected');
              console.log(`   Status: ${res.statusCode}`);
              resolve(true);
            }
          } else if (res.statusCode === 404) {
            console.log('⚠️  Index not found, but connection is working');
            console.log('   You may need to create the index or check the index name');
            resolve(true);
          } else {
            console.log(`❌ Elasticsearch connection failed!`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Response: ${data.substring(0, 200)}...`);
            resolve(false);
          }
        });
      });
      
      req.on('error', (error) => {
        console.log(`❌ Connection error: ${error.message}`);
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        console.log('❌ Connection timeout');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    console.log(`❌ Invalid URL: ${error.message}`);
    return false;
  }
}

async function testOpenAIConnection() {
  console.log('\n🤖 Testing OpenAI Connection...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Missing OpenAI API key!');
    console.log('   Please run: node setup-env.js');
    return false;
  }
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...`);
  
  try {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ OpenAI connection successful!');
            try {
              const result = JSON.parse(data);
              const models = result.data?.filter(m => m.id.includes('gpt')) || [];
              console.log(`📋 Available GPT models: ${models.length}`);
              resolve(true);
            } catch (error) {
              console.log('⚠️  Connection successful but response format unexpected');
              resolve(true);
            }
          } else {
            console.log(`❌ OpenAI connection failed!`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Response: ${data.substring(0, 200)}...`);
            resolve(false);
          }
        });
      });
      
      req.on('error', (error) => {
        console.log(`❌ Connection error: ${error.message}`);
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        console.log('❌ Connection timeout');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Dell Search Demo - Connection Validator');
  console.log('==========================================\n');
  
  const elasticOk = await testElasticsearchConnection();
  const openaiOk = await testOpenAIConnection();
  
  console.log('\n📊 Summary:');
  console.log(`   Elasticsearch: ${elasticOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   OpenAI: ${openaiOk ? '✅ Connected' : '❌ Failed'}`);
  
  if (elasticOk && openaiOk) {
    console.log('\n🎉 All connections successful! You can now run:');
    console.log('   npm run dev');
  } else {
    console.log('\n⚠️  Some connections failed. Please check your configuration.');
    console.log('   Run: node setup-env.js');
  }
}

main().catch(console.error);
