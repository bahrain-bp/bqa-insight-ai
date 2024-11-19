import {Api, StackContext, use} from "sst/constructs";
import {DBStack} from "./DBStack";
import {S3Stack} from "./S3Stack"; 
import { FileMetadataStack } from "./FileMetadataStack";
import {CacheHeaderBehavior, CachePolicy} from "aws-cdk-lib/aws-cloudfront";
import {Duration} from "aws-cdk-lib/core";
import { BedrockStack } from "./BedrockStack";

export function ApiStack({stack}: StackContext) {
    const {table} = use(DBStack);
    const {bucket} = use(S3Stack);
    const {cfnKnowledgeBase, cfnDataSource, cfnAgent, cfnAgentAlias} = use(BedrockStack);
    const {fileMetadataTable} = use(FileMetadataStack);

    // Create the HTTP API
    const api = new Api(stack, "Api", {
        defaults: {
            function: {
                // Bind the table and bucket name to our API
                bind: [table], // Make sure bucket is available to the function
            },
        },
        routes: {
            // Sample Python lambda function
            "GET /": {
                function: {
                    handler: "packages/functions/src/sample-python-lambda/lambda.main",
                    runtime: "python3.11",
                    timeout: "60 seconds",
                },
            },
            // Add the generate-upload-url route
            "POST /generate-upload-url": {
                function: {
                    handler: "packages/functions/src/lambda/generateUploadUrl.handler",
                    environment: {
                        BUCKET_NAME: bucket.bucketName,
                        FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
                    },
                    permissions: [bucket, fileMetadataTable],
                },
            },
            "POST /textract": {
                function: {
                    handler: "packages/functions/src/textract.extractTextFromPDF",
                    permissions: ["textract", "s3"],
                    timeout: "60 seconds",
                }
            },
            "POST /comprehend": {
                function: {
                    handler: "packages/functions/src/comprehend.sendTextToComprehend",
                    permissions: ["comprehend"],
                    timeout: "60 seconds"
                }
            },
            "POST /sync": {
                function: {
                    handler: "packages/functions/src/bedrock/sync.syncKnowlegeBase",
                    permissions: ["bedrock"],
                    timeout: "60 seconds",
                    environment: {
                        KNOWLEDGE_BASE_ID: cfnKnowledgeBase.attrKnowledgeBaseId,
                        DATASOURCE_BASE_ID: cfnDataSource.attrDataSourceId
                    }
                }
            },
            "POST /invokeBedrock": {
                function: {
                    handler: "packages/functions/src/bedrock/invokeBedrock.invokeBedrockAgent",
                    permissions: ["bedrock"],
                    timeout: "60 seconds",
                    environment: {
                        AGENT_ID: cfnAgent?.attrAgentId || "",
                        AGENT_ALIAS_ID: cfnAgentAlias.attrAgentAliasId,
                    }
                }
            }
        },
    });

    // Cache policy to use with CloudFront as reverse proxy to avoid CORS issues
    const apiCachePolicy = new CachePolicy(stack, "CachePolicy", {
        minTtl: Duration.seconds(0), // no cache by default unless backend decides otherwise
        defaultTtl: Duration.seconds(0),
        headerBehavior: CacheHeaderBehavior.allowList(
            "Accept",
            "Authorization",
            "Content-Type",
            "Referer"
        ),
    });

    stack.addOutputs({
        ApiEndpoint: api.url,
    });

    return {api, apiCachePolicy};
}
