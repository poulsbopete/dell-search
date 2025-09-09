import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class DellSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'DellSearchWebsiteBucket', {
      bucketName: `dell-search-website-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'DellSearchDistribution', {
      defaultBehavior: {
        origin: new cloudfront.origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Lambda function for search API
    const searchLambda = new lambda.Function(this, 'SearchLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/search')),
      environment: {
        ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || '',
        ELASTICSEARCH_API_KEY: process.env.ELASTICSEARCH_API_KEY || '',
        ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || 'search-dell',
        ELASTIC_1CHAT_URL: process.env.ELASTIC_1CHAT_URL || '',
        ELASTIC_1CHAT_API_KEY: process.env.ELASTIC_1CHAT_API_KEY || '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Lambda function for chat API
    const chatLambda = new lambda.Function(this, 'ChatLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/chat')),
      environment: {
        ELASTIC_1CHAT_URL: process.env.ELASTIC_1CHAT_URL || '',
        ELASTIC_1CHAT_API_KEY: process.env.ELASTIC_1CHAT_API_KEY || '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'DellSearchApi', {
      restApiName: 'Dell Search API',
      description: 'API for Dell Search Demo',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Search endpoint
    const searchResource = api.root.addResource('api').addResource('search');
    searchResource.addMethod('GET', new apigateway.LambdaIntegration(searchLambda));

    // Chat endpoint
    const chatResource = api.root.addResource('api').addResource('chat');
    chatResource.addMethod('POST', new apigateway.LambdaIntegration(chatLambda));

    // Deploy static website to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../out'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
