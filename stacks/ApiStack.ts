import {Api, StackContext, use} from "sst/constructs";
import {S3Stack} from "./S3Stack"; 
import { FileMetadataStack } from "./FileMetadataStack";
import {CacheHeaderBehavior, CachePolicy} from "aws-cdk-lib/aws-cloudfront";
import {Duration} from "aws-cdk-lib/core";
import { BedrockStack } from "./BedrockStack";
import { BotStack } from "./Lexstacks/BotStack";
import { InstituteMetadataStack } from "./InstituteMetadataStack";
import { UniversityProgramMetadataStack } from "./UniversityProgramMetadataStack";
import { ProgramMetadataStack } from "./ProgramMetadataStack";
import { VocationalCentersMetadataStack } from "./VocationalCentersMetadataStack";
import { OpenDataStack } from "./OpenDataStack";
import { AuthStack } from "./AuthStack";


export function ApiStack({stack}: StackContext) {
    const {bucket} = use(S3Stack);
    const {cfnKnowledgeBase, cfnDataSource, cfnAgent, cfnAgentAlias} = use(BedrockStack);
    const {bot, alias} = use(BotStack);
    const {fileMetadataTable} = use(FileMetadataStack);
    const {instituteMetadata} = use (InstituteMetadataStack);
    const { UniversityProgramMetadataTable } = use(UniversityProgramMetadataStack); 
    const { programMetadataTable } = use(ProgramMetadataStack);  
    const {vocationalCenterMetadataTable} = use (VocationalCentersMetadataStack);
    const { SchoolReviewsTable, VocationalReviewsTable , UniversityReviewsTable } = use(OpenDataStack);
    const {auth} = use(AuthStack)

    // Hardcoded userPoolId and userPoolClientId
    const userPoolId = auth.userPoolId;
    const userPoolClientId = auth.userPoolClientId;

    
    // Create the HTTP API
    const api = new Api(stack, "Api", {
        authorizers: {
            authApi: {
              type: "user_pool",
              userPool: {
                id: userPoolId,
                clientIds: [userPoolClientId],
              },
            },
            adminAuthApi: {
              type: "user_pool",
              userPool: {
                id: userPoolId,
                clientIds: [userPoolClientId],
              },
              identitySource: ["$request.header.Authorization"],
              authorizationScopes: ["aws.cognito.signin.user.admin"],
              properties: {
                AllowedGroupsOverride: ["Admin"],
              },
            },
          },
        routes: {
            // Add the generate-upload-url route
            "POST /generate-upload-url": {
                authorizer: "authApi",
                function: {
                    handler: "packages/functions/src/lambda/generateUploadUrl.handler",
                    environment: {
                        BUCKET_NAME: bucket.bucketName,
                        FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
                    },
                    permissions: [bucket, fileMetadataTable],
                },
            },
            
            // retrieve-file-metadata route
            "GET /retrieve-file-metadata": {
                authorizer: "authApi", 
                function: {
                    handler: "packages/functions/src/lambda/retrieveFileMetadata.handler",
                    environment: {
                        FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
                    },
                    permissions: [fileMetadataTable],
                },
            },
            // delete-file route
            "POST /delete-file": {
                authorizer: "authApi",
                function: {
                    handler: "packages/functions/src/lambda/deleteFile.handler",
                    environment: {
                        BUCKET_NAME: bucket.bucketName,
                        FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
                        INSTITUTE_METADATA_TABLE : instituteMetadata.tableName,
                        PROGRAM_METADATA_TABLE_NAME : programMetadataTable.tableName,
                        VOCATIONAL_CENTER_METADATA_TABLE_NAME :vocationalCenterMetadataTable.tableName,
                        UNIVERSITY_METADATA_TABLE_NAME :UniversityProgramMetadataTable.tableName,
                        KNOWLEDGE_BASE_ID: cfnKnowledgeBase.attrKnowledgeBaseId,
                        DATASOURCE_BASE_ID: cfnDataSource.attrDataSourceId

                    },
                    permissions: [bucket, fileMetadataTable, instituteMetadata, programMetadataTable, UniversityProgramMetadataTable, vocationalCenterMetadataTable, "bedrock"],
                },
            },
            "POST /lex/start-session": {
                function: {
                    handler: "packages/functions/src/LexBot/startLexSession.handler",
                    permissions: ["lex"],
                    timeout: "60 seconds",
                    environment: {
                        BOT_ID: bot.resource.ref,
                        BOT_ALIAS_ID: alias.resource.ref,
                        LOCALE_ID: "en_US",
                    }
                }
            },
            "POST /lex/message-lex": {
                function: {
                    handler: "packages/functions/src/LexBot/messageLex.handler",
                    permissions: ["lex"],
                    timeout: "60 seconds",
                    environment: {
                        BOT_ID: bot.resource.ref,
                        BOT_ALIAS_ID: alias.resource.ref,
                        LOCALE_ID: "en_US",
                    }
                }
            },
            "POST /invokeBedrockAgent": {
                function: {
                    handler: "packages/functions/src/bedrock/invokeBedrock.invokeBedrockAgent",
                    permissions: ["bedrock", "s3", "textract", "bedrock:invokeModel"],
                    timeout: "60 seconds",
                     environment: {
                         AGENT_ID: cfnAgent?.attrAgentId || "",
                         AGENT_ALIAS_ID: cfnAgentAlias.attrAgentAliasId,
                   }
                }
            },
            "GET /fetchfilters": {
                function: {
                    handler: "packages/functions/src/fetchfilters.handler", // Points to the same Lambda function handler for the GET request to fetch filters
                    environment: {
                        TABLE_NAME: instituteMetadata.tableName,// The DynamoDB table for schools and vocational centers metadata
                        UNIVERSITY_TABLE_NAME: UniversityProgramMetadataTable.tableName, // The DynamoDB table for university program metadata
                        PROGRAM_TABLE_NAME: programMetadataTable.tableName, // The DynamoDB table for program metadata
                        VOCATIONAL_TABLE_NAME : vocationalCenterMetadataTable.tableName, // The DynamoDB table for vocational center metadata

                    },
                    permissions: [
                    instituteMetadata, // Permissions required to access the schools and vocational center metadata table
                    UniversityProgramMetadataTable, // Permissions required to access the university program metadata table
                    programMetadataTable, // Permissions required to access the program metadata table
                    vocationalCenterMetadataTable // Permissions required to access the vocational center metadata table
                     ],
                }
            },
            "GET /fetchSchoolReviews": {
                function: {
                    handler: "packages/functions/src/api/retrieveSchoolReviews.handler", 
                    environment: {
                        SCHOOL_REVIEWS_TABLE_NAME: SchoolReviewsTable.tableName,
                    },
                    permissions: [SchoolReviewsTable], 
                }
            },
            "GET /fetchVocationalReviews": {
                function: {
                    handler: "packages/functions/src/api/retrieveVocationalReviews.handler", 
                    environment: {
                        VOCATIONAL_REVIEWS_TABLE_NAME: VocationalReviewsTable.tableName,
                    },
                    permissions: [VocationalReviewsTable], 
                }
            },
            "GET /fetchUniversityReviews": {
                function: {
                    handler: "packages/functions/src/api/retrieveUniversityReviews.handler",
                    environment: {
                        UNIVERSITY_REVIEWS_TABLE_NAME: UniversityReviewsTable.tableName,
                    },
                    permissions: [UniversityReviewsTable], // Ensure permissions are correctly set
                },
            },
        }
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
