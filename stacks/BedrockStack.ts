import { StackContext, Topic, use } from "sst/constructs";
import {S3Stack} from "./S3Stack"; 
import {aws_bedrock as bedrock, aws_iam as iam} from "aws-cdk-lib";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";

export function BedrockStack({ stack, app }: StackContext) {
    
    const {bucket, syncTopic} = use(S3Stack);

    // create knowledgebase storage configuration
    const storageConfigurationProperty: bedrock.CfnKnowledgeBase.StorageConfigurationProperty = {
        type: 'OPENSEARCH_SERVERLESS',
        // Configure the openSearchServerless as vector store
        opensearchServerlessConfiguration: {
          // collectionArn: 'arn:aws:aoss:us-east-1:588738578192:collection/tl3oyze7ocph2xyqb54i',
          collectionArn: 'arn:aws:aoss:us-east-1:588738578192:collection/w15yhb6d8ws798nmv9l8',
          fieldMapping: {
            metadataField: 'AMAZON_BEDROCK_METADATA',
            textField: 'AMAZON_BEDROCK_TEXT_CHUNK',
            vectorField: 'bedrock-knowledge-base-default-vector',
          },
          vectorIndexName: 'bedrock-knowledge-base-default-index',
        }}
    
    // create the Knowledgebase
    const cfnKnowledgeBase = new bedrock.CfnKnowledgeBase(stack, 'KnowledgeBaseSST', {
        knowledgeBaseConfiguration: {
          type: 'VECTOR',
          vectorKnowledgeBaseConfiguration: {
            embeddingModelArn: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',
            embeddingModelConfiguration: {
              bedrockEmbeddingModelConfiguration: {
                dimensions: 1024, // 1024 becuase the embedding model output vector size is 1024
              },
            },
          },
        },
        name: 'KnowledgeBaseSST-'+app.stage,
        roleArn: 'arn:aws:iam::588738578192:role/service-role/AmazonBedrockExecutionRoleForKnowledgeBase_duktm',
        storageConfiguration: storageConfigurationProperty
    });

    // create the agent role
    const amazonBedrockExecutionRoleForAgents = new iam.Role(stack, "amazonBedrockExecutionRoleForAgents", {
      assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
    });

    // allow the retreieve operation for the role
    amazonBedrockExecutionRoleForAgents.addToPolicy(new iam.PolicyStatement({
      actions: [
        "bedrock:Retrieve"
      ],
      resources: [
        cfnKnowledgeBase.attrKnowledgeBaseArn
      ]
    }));

    // allow the invokeModel operation for the role
    amazonBedrockExecutionRoleForAgents.addToPolicy(new iam.PolicyStatement({
      actions: [
        "bedrock:InvokeModel"
      ],
      resources: ["arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"]
    }));

    // configure the data source, S3
    const cfnDataSource = new bedrock.CfnDataSource(stack, 'KnowledgeBaseSSTDataSource', {
        dataSourceConfiguration: {
          type: 'S3',
      
          s3Configuration: {
            bucketArn: bucket.bucketArn,
            // for better accuracy, we will use textfiles only for the knowledgebase
            bucketOwnerAccountId: stack.account,
            inclusionPrefixes: ['TextFiles/'],
          },
        },
        knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,
        name: `KnowledgeBaseSSTDataSource-${app.stage}`,
      
        // // the properties below are optional
        // vectorIngestionConfiguration: {
        //   chunkingConfiguration: {
        //     chunkingStrategy: 'chunkingStrategy',
      
        //     // the properties below are optional
        //     fixedSizeChunkingConfiguration: {
        //       maxTokens: 123,
        //       overlapPercentage: 123,
        //     },
        //     hierarchicalChunkingConfiguration: {
        //       levelConfigurations: [{
        //         maxTokens: 123,
        //       }],
        //       overlapTokens: 123,
        //     },
        //     semanticChunkingConfiguration: {
        //       breakpointPercentileThreshold: 123,
        //       bufferSize: 123,
        //       maxTokens: 123,
        //     },
        //   },
        //   customTransformationConfiguration: {
        //     intermediateStorage: {
        //       s3Location: {
        //         uri: 'uri',
        //       },
        //     },
        //     transformations: [{
        //       stepToApply: 'stepToApply',
        //       transformationFunction: {
        //         transformationLambdaConfiguration: {
        //           lambdaArn: 'lambdaArn',
        //         },
        //       },
        //     }],
        //   },
        //   parsingConfiguration: {
        //     parsingStrategy: 'parsingStrategy',
      
        //     // the properties below are optional
        //     bedrockFoundationModelConfiguration: {
        //       modelArn: 'modelArn',
      
        //       // the properties below are optional
        //       parsingPrompt: {
        //         parsingPromptText: 'parsingPromptText',
        //       },
        //     },
        //   },
        // },
      });

      // Configure the agent
      var cfnAgent = undefined
        cfnAgent = new bedrock.CfnAgent(stack, "BQACfnAgent", {
          agentName: "BQAInsightAIModel-"+app.stage,
          agentResourceRoleArn: amazonBedrockExecutionRoleForAgents.roleArn,
          foundationModel: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
          idleSessionTtlInSeconds: 600, // 5 minutes session, same as lex
          instruction: `You are a polite and friendly assistant specializing in answering questions and queries about BQA-published reports.
          Your primary role is to provide concise, accurate, and helpful responses based on the content of these reports.
          For general queries, like greetings or small talk, respond warmly and conversationally to make users feel comfortable.
          If a question is outside the scope of BQA reports, gently redirect the user back to relevant topics or provide a fallback response, such as asking for clarification or offering to escalate the query to support.
          Always strive to maintain a helpful and approachable tone while staying focused on your purpose.`,
          knowledgeBases: [{
            description: `It contains BQA reports for queries about Bahrain's education system. Avoid using it for greetings or small talks.`,
            knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,
            knowledgeBaseState: 'ENABLED',
            }],
          }
        );
        stack.addOutputs({Agent: cfnAgent.agentName})
      
      // create the agent alias
      const cfnAgentAlias = new bedrock.CfnAgentAlias(stack, 'BQACfnAgentAlias', {
        agentAliasName: 'BQACfnAgentAlias-'+app.stage,
        agentId: cfnAgent?.attrAgentId || "",
      });
    
    // add subscriber for the SNS topic for syncing
    syncTopic.addSubscribers(stack, {
        sync: {
            function: {
                handler: "packages/functions/src/bedrock/sync.syncKnowlegeBase",
                timeout: 120,
                environment: {
                    KNOWLEDGE_BASE_ID: cfnKnowledgeBase.attrKnowledgeBaseId,
                    DATASOURCE_BASE_ID: cfnDataSource.attrDataSourceId,
                },
                permissions: ["bedrock"]
            }
        }
    })

    stack.addOutputs({
        KnowledgeBase: cfnKnowledgeBase.name,
        DataSource: cfnDataSource.name,
    });

    return { cfnKnowledgeBase, cfnDataSource, cfnAgent, cfnAgentAlias};
}      
