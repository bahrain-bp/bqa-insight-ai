import { StackContext, Topic, use } from "sst/constructs";
import {S3Stack} from "./S3Stack"; 
import {aws_bedrock as bedrock, aws_iam as iam} from "aws-cdk-lib";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";

export function BedrockStack({ stack, app }: StackContext) {
    
    const {bucket, syncTopic} = use(S3Stack);

    // create knowledgebase storage configuration
    const storageConfigurationProperty: bedrock.CfnKnowledgeBase.StorageConfigurationProperty = {
        type: 'OPENSEARCH_SERVERLESS',
        // the properties below are optional
        opensearchServerlessConfiguration: {
          collectionArn: 'arn:aws:aoss:us-east-1:588738578192:collection/tl3oyze7ocph2xyqb54i',
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
      
            // the properties below are optional
            embeddingModelConfiguration: {
              bedrockEmbeddingModelConfiguration: {
                dimensions: 1024,
              },
            },
          },
        },
        name: 'KnowledgeBaseSST-'+app.stage,
        roleArn: 'arn:aws:iam::588738578192:role/service-role/AmazonBedrockExecutionRoleForKnowledgeBase_duktm',
        storageConfiguration: storageConfigurationProperty
    });

    const amazonBedrockExecutionRoleForAgents = new iam.Role(stack, "amazonBedrockExecutionRoleForAgents", {
      assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
    });

    amazonBedrockExecutionRoleForAgents.addToPolicy(new iam.PolicyStatement({
      actions: [
        "bedrock:Retrieve"
      ],
      resources: [
        cfnKnowledgeBase.attrKnowledgeBaseArn
      ]
    }));

    amazonBedrockExecutionRoleForAgents.addToPolicy(new iam.PolicyStatement({
      actions: [
        "bedrock:InvokeModel"
      ],
      resources: ["arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"]
    }));

    const cfnDataSource = new bedrock.CfnDataSource(stack, 'KnowledgeBaseSSTDataSource', {
        dataSourceConfiguration: {
          type: 'S3',
      
          s3Configuration: {
            bucketArn: bucket.bucketArn,
      
            // the properties below are optional
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
      var cfnAgent = undefined
      // if (app.stage == "prod" || app.stage == "hasan") {
        cfnAgent = new bedrock.CfnAgent(stack, "BQACfnAgent", {
          agentName: "BQAInsightAIModel-"+app.stage,
          // agentResourceRoleArn: 'arn:aws:iam::588738578192:role/service-role/AmazonBedrockExecutionRoleForAgents_GQ6EX8SHLRV',
          agentResourceRoleArn: amazonBedrockExecutionRoleForAgents.roleArn,
          foundationModel: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
          idleSessionTtlInSeconds: 600,
          instruction: 'Analyze All reports and produce powerful insights based on that data. Generate data in tables if prompted to as well.',
          knowledgeBases: [{
            description: 'Use the newest data as default, unless it is specified otherwise',
            knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,
            knowledgeBaseState: 'ENABLED',
            }],
          }
        );
        stack.addOutputs({Agent: cfnAgent.agentName})
      // }

      const cfnAgentAlias = new bedrock.CfnAgentAlias(stack, 'BQACfnAgentAlias', {
        agentAliasName: 'BQACfnAgentAlias-'+app.stage,
        agentId: cfnAgent?.attrAgentId || "",
      });

      // llama
      var cfnAgentLlama = undefined
      // if (app.stage == "prod" || app.stage == "hasan") {
        cfnAgentLlama = new bedrock.CfnAgent(stack, "BQACfnAgentLlama", {
          agentName: "BQAInsightAIModelLlama-"+app.stage,
          // agentResourceRoleArn: 'arn:aws:iam::588738578192:role/service-role/AmazonBedrockExecutionRoleForAgents_GQ6EX8SHLRV',
          agentResourceRoleArn: amazonBedrockExecutionRoleForAgents.roleArn,
          foundationModel: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
          idleSessionTtlInSeconds: 600,
          instruction: 'Analyze All reports and produce powerful insights based on that data. Generate data in tables if prompted to as well.',
          knowledgeBases: [{
            description: 'Use the newest data as default, unless it is specified otherwise',
            knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,
            knowledgeBaseState: 'ENABLED',
            }],
          }
        );
        stack.addOutputs({AgentLLama: cfnAgentLlama.agentName})
      // }

      const cfnAgentAliasLlama = new bedrock.CfnAgentAlias(stack, 'BQACfnAgentAliasLlama', {
        agentAliasName: 'BQACfnAgentAliasLlama-'+app.stage,
        agentId: cfnAgentLlama?.attrAgentId || "",
      });
      

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

    return { cfnKnowledgeBase, cfnDataSource, cfnAgent, cfnAgentAlias, cfnAgentLlama, cfnAgentAliasLlama };
}      
