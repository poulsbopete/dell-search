#!/bin/bash

# Dell Search Demo - AWS Deployment Script
set -e

echo "🚀 Starting Dell Search Demo deployment to AWS..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed. Installing..."
    npm install -g aws-cdk
fi

# Check if environment variables are set
if [ -z "$ELASTICSEARCH_URL" ] || [ -z "$ELASTICSEARCH_API_KEY" ] || [ -z "$ELASTIC_1CHAT_URL" ] || [ -z "$ELASTIC_1CHAT_API_KEY" ]; then
    echo "❌ Required environment variables are not set:"
    echo "   - ELASTICSEARCH_URL"
    echo "   - ELASTICSEARCH_API_KEY"
    echo "   - ELASTIC_1CHAT_URL"
    echo "   - ELASTIC_1CHAT_API_KEY"
    echo "   - OPENAI_API_KEY (optional)"
    exit 1
fi

# Build the frontend
echo "📦 Building Next.js application..."
npm run build

# Set API Gateway URL for production
API_GATEWAY_URL="https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod"
echo "NEXT_PUBLIC_API_BASE_URL=$API_GATEWAY_URL" > .env.production

# Build again with production API URL
npm run build

# Install CDK dependencies
echo "📦 Installing CDK dependencies..."
cd aws-deployment
npm install

# Bootstrap CDK (if not already done)
echo "🔧 Bootstrapping CDK..."
cdk bootstrap

# Deploy the infrastructure
echo "🏗️ Deploying AWS infrastructure..."
cdk deploy --require-approval never

# Get the API Gateway URL from the output
API_URL=$(aws cloudformation describe-stacks --stack-name DellSearchStack --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayURL`].OutputValue' --output text)
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name DellSearchStack --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' --output text)

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application is now available at:"
echo "   Frontend: $CLOUDFRONT_URL"
echo "   API: $API_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Update your frontend to use the API Gateway URL"
echo "   2. Test the application"
echo "   3. Configure custom domain (optional)"
echo ""
echo "🔧 To update the API Gateway URL in your frontend:"
echo "   export NEXT_PUBLIC_API_BASE_URL=$API_URL"
echo "   npm run build"
echo "   # Redeploy to S3/CloudFront"
