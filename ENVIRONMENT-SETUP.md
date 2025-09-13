# Environment Setup Guide

This guide will help you set up the environment variables needed to connect to Elastic Serverless and OpenAI.

## Quick Setup

### Option 1: Interactive Setup (Recommended)
```bash
npm run setup:env
```

This will guide you through setting up your `.env.local` file with all required environment variables.

### Option 2: Manual Setup
1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your actual values:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Elasticsearch Configuration
   ELASTICSEARCH_URL=https://your-deployment.es.us-east-1.aws.elastic.cloud:443
   ELASTICSEARCH_API_KEY=your_elasticsearch_api_key_here
   ELASTICSEARCH_INDEX=search-dell
   ```

## Getting Your Credentials

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Elasticsearch Credentials
1. Go to [Elastic Cloud](https://cloud.elastic.co/)
2. Sign in to your account
3. Navigate to your deployment
4. Go to the "Endpoints" section
5. Copy the Elasticsearch URL
6. Go to "Security" → "API Keys" to create an API key

## Validation

After setting up your environment, validate your connections:

```bash
npm run validate:connections
```

This will test both your Elasticsearch and OpenAI connections.

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes | `sk-proj-...` |
| `ELASTICSEARCH_URL` | Your Elasticsearch endpoint URL | Yes | `https://deployment.es.us-east-1.aws.elastic.cloud:443` |
| `ELASTICSEARCH_API_KEY` | Your Elasticsearch API key | Yes | `Base64 encoded key` |
| `ELASTICSEARCH_INDEX` | The index name to search | No (default: `search-dell`) | `search-dell` |
| `NEXT_PUBLIC_API_BASE_URL` | Override API base URL for production | No | `https://api.example.com` |

## Troubleshooting

### Common Issues

1. **"Missing Elasticsearch configuration"**
   - Run `npm run setup:env` to create your `.env.local` file
   - Ensure all required variables are set

2. **"Elasticsearch connection failed"**
   - Check your Elasticsearch URL format
   - Verify your API key is correct
   - Ensure your deployment is running

3. **"OpenAI connection failed"**
   - Verify your API key is valid
   - Check if you have sufficient credits
   - Ensure the key has the correct permissions

4. **"Index not found"**
   - This is normal if you haven't created the index yet
   - The connection is working, you just need to populate the index

### Testing Individual Components

Test Elasticsearch only:
```bash
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('ES URL:', process.env.ELASTICSEARCH_URL);
console.log('ES Key:', process.env.ELASTICSEARCH_API_KEY ? 'Set' : 'Missing');
"
```

Test OpenAI only:
```bash
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');
"
```

## Security Notes

- Never commit your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore`
- Keep your API keys secure and rotate them regularly
- Use environment-specific keys for different deployments

## Next Steps

After successful setup:
1. Run `npm run dev` to start the development server
2. Test the search functionality
3. Test the chat functionality
4. Deploy to production using `npm run deploy:aws`
