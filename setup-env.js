#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Dell Search Demo - Environment Setup');
  console.log('=====================================\n');
  
  console.log('This script will help you create a .env.local file with the correct');
  console.log('environment variables for connecting to Elastic Serverless and OpenAI.\n');

  // OpenAI Configuration
  console.log('📝 OpenAI Configuration:');
  const openaiApiKey = await question('Enter your OpenAI API Key: ');
  
  if (!openaiApiKey.trim()) {
    console.log('❌ OpenAI API Key is required!');
    process.exit(1);
  }

  // Elasticsearch Configuration
  console.log('\n🔍 Elasticsearch Configuration:');
  console.log('You can find these values in your Elastic Cloud console:');
  console.log('- Go to https://cloud.elastic.co/');
  console.log('- Navigate to your deployment');
  console.log('- Go to "Endpoints" section\n');

  const elasticsearchUrl = await question('Enter your Elasticsearch URL (e.g., https://your-deployment.es.us-east-1.aws.elastic.cloud:443): ');
  const elasticsearchApiKey = await question('Enter your Elasticsearch API Key: ');
  const elasticsearchIndex = await question('Enter your Elasticsearch Index name (default: search-dell): ') || 'search-dell';

  // Validate required fields
  if (!elasticsearchUrl.trim() || !elasticsearchApiKey.trim()) {
    console.log('❌ Elasticsearch URL and API Key are required!');
    process.exit(1);
  }

  // Create .env.local content
  const envContent = `# Dell Search Demo - Environment Configuration
# Generated on ${new Date().toISOString()}

# OpenAI Configuration
OPENAI_API_KEY=${openaiApiKey.trim()}

# Elasticsearch Configuration
ELASTICSEARCH_URL=${elasticsearchUrl.trim()}
ELASTICSEARCH_API_KEY=${elasticsearchApiKey.trim()}
ELASTICSEARCH_INDEX=${elasticsearchIndex.trim()}

# Optional: Override API Base URL for production
# NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
`;

  // Write .env.local file
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment file created successfully!');
    console.log(`📁 Location: ${envPath}`);
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Run "npm run dev" to start the development server');
    console.log('2. Test the search functionality');
    console.log('3. Test the chat functionality');
    
    console.log('\n📋 Environment Variables Set:');
    console.log(`   OPENAI_API_KEY: ${openaiApiKey.substring(0, 20)}...`);
    console.log(`   ELASTICSEARCH_URL: ${elasticsearchUrl}`);
    console.log(`   ELASTICSEARCH_API_KEY: ${elasticsearchApiKey.substring(0, 20)}...`);
    console.log(`   ELASTICSEARCH_INDEX: ${elasticsearchIndex}`);
    
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
    process.exit(1);
  }

  rl.close();
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n❌ Setup cancelled by user');
  rl.close();
  process.exit(0);
});

// Run the setup
setupEnvironment().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
