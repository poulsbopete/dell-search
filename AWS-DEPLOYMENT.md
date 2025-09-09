# AWS Deployment Guide - Dell Search Demo

This guide will help you deploy the Dell Search Demo to AWS using CloudFront for the frontend and API Gateway with Lambda for the backend.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   API Gateway    │    │   Lambda        │
│   (Frontend)    │◄──►│   (Backend API)  │◄──►│   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   S3 Bucket     │    │   CORS Headers   │    │   Elasticsearch │
│   (Static Files)│    │   (Cross-Origin) │    │   + 1Chat APIs  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- AWS CDK installed globally: `npm install -g aws-cdk`

### 2. Environment Variables
Set the following environment variables:

```bash
# Elasticsearch Configuration
export ELASTICSEARCH_URL="https://your-elasticsearch-url"
export ELASTICSEARCH_API_KEY="your_elasticsearch_api_key"
export ELASTICSEARCH_INDEX="search-dell"

# Elastic 1Chat Configuration
export ELASTIC_1CHAT_URL="https://your-1chat-url"
export ELASTIC_1CHAT_API_KEY="your_1chat_api_key"

# OpenAI (Optional - for fallback responses)
export OPENAI_API_KEY="your_openai_api_key"
```

### 3. Required Tools
- Node.js 18+
- npm or yarn
- AWS CLI
- AWS CDK

## 🚀 Deployment Steps

### Step 1: Prepare the Application

1. **Clone and setup the repository:**
   ```bash
   git clone git@github.com:poulsbopete/dell-search.git
   cd dell-search
   npm install
   ```

2. **Set environment variables:**
   ```bash
   # Copy the example and fill in your values
   cp .env.local.example .env.local
   ```

### Step 2: Build the Frontend

1. **Build the Next.js application:**
   ```bash
   npm run build
   ```

   This creates a static export in the `out/` directory.

### Step 3: Deploy AWS Infrastructure

1. **Install CDK dependencies:**
   ```bash
   cd aws-deployment
   npm install
   ```

2. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

3. **Deploy the infrastructure:**
   ```bash
   cdk deploy
   ```

   This will create:
   - S3 bucket for static website hosting
   - CloudFront distribution
   - API Gateway
   - Lambda functions for search and chat APIs
   - IAM roles and policies

### Step 4: Update Frontend Configuration

After deployment, you'll get the API Gateway URL. Update your frontend configuration:

1. **Get the API Gateway URL from the CDK output**

2. **Set the API base URL:**
   ```bash
   export NEXT_PUBLIC_API_BASE_URL="https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod"
   ```

3. **Rebuild the frontend:**
   ```bash
   npm run build
   ```

4. **Redeploy to S3:**
   ```bash
   cd aws-deployment
   cdk deploy
   ```

## 🔧 Manual Deployment (Alternative)

If you prefer to deploy manually:

### 1. Deploy Lambda Functions

```bash
# Create deployment packages
cd aws-deployment/lambda/search
zip -r search-lambda.zip .
aws lambda create-function \
  --function-name dell-search-search \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://search-lambda.zip

cd ../chat
zip -r chat-lambda.zip .
aws lambda create-function \
  --function-name dell-search-chat \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://chat-lambda.zip
```

### 2. Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api --name "Dell Search API"

# Create resources and methods
# (This is complex - use CDK for easier management)
```

### 3. Deploy to S3 and CloudFront

```bash
# Create S3 bucket
aws s3 mb s3://dell-search-website-YOUR_ACCOUNT

# Upload static files
aws s3 sync out/ s3://dell-search-website-YOUR_ACCOUNT

# Create CloudFront distribution
# (Use AWS Console or CDK for easier setup)
```

## 📊 Monitoring and Logs

### CloudWatch Logs
- Lambda function logs: `/aws/lambda/dell-search-search` and `/aws/lambda/dell-search-chat`
- API Gateway logs: Enable in API Gateway console

### CloudWatch Metrics
- Lambda invocations, errors, duration
- API Gateway request count, latency, error rates
- CloudFront cache hit ratio, origin requests

## 🔒 Security Considerations

### 1. Environment Variables
- Store sensitive data in AWS Systems Manager Parameter Store
- Use IAM roles instead of hardcoded credentials

### 2. CORS Configuration
- API Gateway is configured with permissive CORS for development
- Restrict origins in production

### 3. Lambda Security
- Functions run with minimal IAM permissions
- VPC configuration if needed for private resources

## 🚨 Troubleshooting

### Common Issues

1. **CDK Bootstrap Error**
   ```bash
   cdk bootstrap aws://YOUR_ACCOUNT/YOUR_REGION
   ```

2. **Lambda Timeout**
   - Increase timeout in CDK stack
   - Check Elasticsearch/1Chat API response times

3. **CORS Issues**
   - Verify API Gateway CORS configuration
   - Check preflight OPTIONS requests

4. **Environment Variables Not Set**
   - Verify Lambda environment variables in AWS Console
   - Check CDK stack configuration

### Debug Commands

```bash
# Check CDK stack status
cdk list
cdk diff

# View CloudFormation stack
aws cloudformation describe-stacks --stack-name DellSearchStack

# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/dell-search"

# Test API Gateway
curl -X GET "https://your-api-gateway-url/execute-api.us-east-1.amazonaws.com/prod/api/search?q=laptop"
```

## 💰 Cost Optimization

### Estimated Monthly Costs (us-east-1)
- **Lambda**: ~$5-20 (depending on usage)
- **API Gateway**: ~$3-10 (per million requests)
- **CloudFront**: ~$1-5 (data transfer)
- **S3**: ~$1-3 (storage and requests)

### Cost Optimization Tips
1. Use CloudFront caching effectively
2. Optimize Lambda memory allocation
3. Implement request throttling
4. Use S3 Intelligent Tiering

## 🔄 Updates and Maintenance

### Updating the Application

1. **Code Changes:**
   ```bash
   # Make your changes
   npm run build
   cd aws-deployment
   cdk deploy
   ```

2. **Environment Variable Changes:**
   ```bash
   # Update CDK stack with new environment variables
   cd aws-deployment
   cdk deploy
   ```

3. **Lambda Function Updates:**
   ```bash
   # CDK automatically updates Lambda functions
   cd aws-deployment
   cdk deploy
   ```

### Monitoring and Alerts

Set up CloudWatch alarms for:
- Lambda error rates > 5%
- API Gateway 4xx/5xx errors
- CloudFront cache hit ratio < 80%

## 📞 Support

For deployment issues:
1. Check AWS CloudFormation console for stack events
2. Review CloudWatch logs
3. Verify environment variables
4. Test API endpoints individually

## 🎯 Next Steps

After successful deployment:
1. Configure custom domain (optional)
2. Set up monitoring and alerts
3. Implement CI/CD pipeline
4. Add authentication/authorization
5. Optimize performance and costs
