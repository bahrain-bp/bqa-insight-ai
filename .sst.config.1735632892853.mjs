import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// stacks/Lexstacks/BotStack.ts
import { use as use3 } from "sst/constructs";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { ServicePrincipal as ServicePrincipal2 } from "aws-cdk-lib/aws-iam";
import { Duration, aws_iam as iam2 } from "aws-cdk-lib";
import {
  LexCustomResource,
  LexBotDefinition
} from "@amaabca/aws-lex-custom-resources";

// stacks/BedrockStack.ts
import { use as use2 } from "sst/constructs";

// stacks/S3Stack.ts
import { Bucket, Function, Queue, use, toCdkDuration, Topic } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib/core";

// stacks/FileMetadataStack.ts
import { Table } from "sst/constructs";
function FileMetadataStack({ stack }) {
  const fileMetadataTable = new Table(stack, "FileMetadata", {
    fields: {
      fileKey: "string",
      fileName: "string",
      fileURL: "string",
      fileSize: "number",
      fileType: "string",
      uploadedAt: "string"
    },
    primaryIndex: { partitionKey: "fileKey" }
  });
  stack.addOutputs({
    FileMetadataTableName: fileMetadataTable.tableName
  });
  return { fileMetadataTable };
}
__name(FileMetadataStack, "FileMetadataStack");

// stacks/InstituteMetadataStack.ts
import { Table as Table2 } from "sst/constructs";
function InstituteMetadataStack({ stack }) {
  const instituteMetadata = new Table2(stack, "InstituteMetadata", {
    fields: {
      institueName: "string",
      instituteClassification: "number",
      instituteGradeLevels: "string",
      instituteLocation: "string",
      dateOfReview: "string"
    },
    primaryIndex: { partitionKey: "institueName" }
  });
  stack.addOutputs({
    InstituteMetadataTableName: instituteMetadata.tableName
  });
  return { instituteMetadata };
}
__name(InstituteMetadataStack, "InstituteMetadataStack");

// stacks/ProgramMetadataStack.ts
import { Table as Table3 } from "sst/constructs";
function ProgramMetadataStack({ stack }) {
  const programMetadataTable = new Table3(stack, "ProgramMetadataStack", {
    fields: {
      universityName: "string",
      programmeName: "string",
      programmeJudgment: "string"
    },
    primaryIndex: { partitionKey: "universityName", sortKey: "programmeName" }
  });
  stack.addOutputs({
    ProgramMetadataStack: programMetadataTable.tableName
  });
  return { programMetadataTable };
}
__name(ProgramMetadataStack, "ProgramMetadataStack");

// stacks/UniversityProgramMetadataStack.ts
import { Table as Table4 } from "sst/constructs";
function UniversityProgramMetadataStack({ stack }) {
  const UniversityProgramMetadataTable = new Table4(stack, "UniversityProgramMetadataStackk", {
    fields: {
      universityName: "string",
      location: "string",
      numOfPrograms: "number",
      numOfQualifications: "number"
    },
    primaryIndex: { partitionKey: "universityName" }
  });
  stack.addOutputs({
    UniversityProgramMetadataStack: UniversityProgramMetadataTable.tableName
  });
  return { UniversityProgramMetadataTable };
}
__name(UniversityProgramMetadataStack, "UniversityProgramMetadataStack");

// stacks/OpenDataStack.ts
import { Table as Table5 } from "sst/constructs";
function OpenDataStack({ stack }) {
  const SchoolReviewsTable = new Table5(stack, "SchoolReviews", {
    fields: {
      InstitutionCode: "string"
    },
    primaryIndex: { partitionKey: "InstitutionCode" }
  });
  const HigherEducationProgrammeReviewsTable = new Table5(stack, "HigherEducationProgrammeReviews", {
    fields: {
      Index: "number"
    },
    primaryIndex: { partitionKey: "Index" }
  });
  const NationalFrameworkOperationsTable = new Table5(stack, "NationalFrameworkOperations", {
    fields: {
      RecordId: "string"
    },
    primaryIndex: { partitionKey: "RecordId" }
  });
  const VocationalReviewsTable = new Table5(stack, "VocationalReviews", {
    fields: {
      InstitutionCode: "string"
    },
    primaryIndex: { partitionKey: "InstitutionCode" }
  });
  const UniversityReviewsTable = new Table5(stack, "UniversityReviews", {
    fields: {
      InstitutionCode: "string"
    },
    primaryIndex: { partitionKey: "InstitutionCode" }
  });
  stack.addOutputs({
    SchoolReviewsTable: SchoolReviewsTable.tableName,
    HigherEducationReviewsTableName: HigherEducationProgrammeReviewsTable.tableName,
    NationalFrameworkOperationsTableName: NationalFrameworkOperationsTable.tableName,
    VocationalReviewsTableName: VocationalReviewsTable.tableName,
    UniversityReviewsTableName: UniversityReviewsTable.tableName
  });
  return {
    SchoolReviewsTable,
    HigherEducationProgrammeReviewsTable,
    NationalFrameworkOperationsTable,
    VocationalReviewsTable,
    UniversityReviewsTable
  };
}
__name(OpenDataStack, "OpenDataStack");

// stacks/VocationalCentersMetadataStack.ts
import { Table as Table6 } from "sst/constructs";
function VocationalCentersMetadataStack({ stack }) {
  const vocationalCenterMetadataTable = new Table6(stack, "vocationalCenterMetadata", {
    fields: {
      vocationalCenterName: "string",
      vocationalCenterLocation: "string",
      dateOfReview: "string"
    },
    primaryIndex: { partitionKey: "vocationalCenterName" }
  });
  stack.addOutputs({
    VocationCenterMetadataTableName: vocationalCenterMetadataTable.tableName
  });
  return { vocationalCenterMetadataTable };
}
__name(VocationalCentersMetadataStack, "VocationalCentersMetadataStack");

// stacks/S3Stack.ts
function S3Stack({ stack }) {
  const { fileMetadataTable } = use(FileMetadataStack);
  const { instituteMetadata } = use(InstituteMetadataStack);
  const { programMetadataTable } = use(ProgramMetadataStack);
  const { UniversityProgramMetadataTable } = use(UniversityProgramMetadataStack);
  const { vocationalCenterMetadataTable } = use(VocationalCentersMetadataStack);
  const { SchoolReviewsTable, HigherEducationProgrammeReviewsTable, NationalFrameworkOperationsTable, VocationalReviewsTable, UniversityReviewsTable } = use(OpenDataStack);
  const bucket = new Bucket(stack, "ReportBucket", {
    cdk: {
      bucket: {
        versioned: true,
        removalPolicy: stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        publicReadAccess: true
      }
    },
    cors: [
      {
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST"],
        allowedOrigins: ["*"],
        exposedHeaders: ["ETag"],
        maxAge: "3000 seconds"
      }
    ]
  });
  const syncTopic = new Topic(stack, "SyncTopic", {
    subscribers: {}
  });
  const extractMetadataQueue = new Queue(stack, "extractMetadataQueue", {
    cdk: {
      queue: {
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: toCdkDuration("301 seconds")
      }
    }
  });
  const extractUniversityMetadata = new Function(stack, "claudeUniversityMetadata", {
    handler: "packages/functions/src/bedrock/claudeUniversityMetadata.handler",
    timeout: "300 seconds",
    permissions: [
      bucket,
      "bedrock",
      "textract",
      fileMetadataTable,
      instituteMetadata,
      extractMetadataQueue,
      programMetadataTable,
      UniversityProgramMetadataTable,
      vocationalCenterMetadataTable
    ],
    environment: {
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      INSTITUTE_METADATA_TABLE_NAME: instituteMetadata.tableName,
      EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
      PROGRAM_METADATA_TABLE_NAME: programMetadataTable.tableName,
      UNIVERSITY_METADATA_TABLE_NAME: UniversityProgramMetadataTable.tableName,
      VOCATIONAL_CENTER_METADATA_TABLE_NAME: vocationalCenterMetadataTable.tableName,
      BUCKET_NAME: bucket.bucketName
    },
    bind: [syncTopic]
  });
  const extractVocationalCentreMetadata = new Function(stack, "claudeVocationalExtractMetadata", {
    handler: "packages/functions/src/bedrock/claudeVocationalExtractMetadata.handler",
    timeout: "300 seconds",
    permissions: [
      bucket,
      "bedrock",
      "textract",
      fileMetadataTable,
      instituteMetadata,
      extractMetadataQueue,
      programMetadataTable,
      UniversityProgramMetadataTable,
      vocationalCenterMetadataTable
    ],
    environment: {
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      INSTITUTE_METADATA_TABLE_NAME: instituteMetadata.tableName,
      EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
      PROGRAM_METADATA_TABLE_NAME: programMetadataTable.tableName,
      UNIVERSITY_METADATA_TABLE_NAME: UniversityProgramMetadataTable.tableName,
      VOCATIONAL_CENTER_METADATA_TABLE_NAME: vocationalCenterMetadataTable.tableName,
      BUCKET_NAME: bucket.bucketName
    },
    bind: [syncTopic]
  });
  const extractProgramMetadata = new Function(stack, "claudeProgramMetadata", {
    handler: "packages/functions/src/bedrock/claudeProgramMetadata.handler",
    timeout: "300 seconds",
    permissions: [
      bucket,
      "bedrock",
      "textract",
      fileMetadataTable,
      instituteMetadata,
      extractMetadataQueue,
      programMetadataTable,
      UniversityProgramMetadataTable,
      vocationalCenterMetadataTable
    ],
    environment: {
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      INSTITUTE_METADATA_TABLE_NAME: instituteMetadata.tableName,
      EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
      PROGRAM_METADATA_TABLE_NAME: programMetadataTable.tableName,
      UNIVERSITY_METADATA_TABLE_NAME: UniversityProgramMetadataTable.tableName,
      VOCATIONAL_CENTER_METADATA_TABLE_NAME: vocationalCenterMetadataTable.tableName,
      BUCKET_NAME: bucket.bucketName
    },
    bind: [syncTopic]
  });
  const extractReportMetadata = new Function(stack, "claudeExtractReportMetadata", {
    handler: "packages/functions/src/bedrock/claudeExtractReportMetadata.handler",
    timeout: "300 seconds",
    permissions: [
      bucket,
      "bedrock",
      "textract",
      fileMetadataTable,
      instituteMetadata,
      extractMetadataQueue,
      programMetadataTable,
      UniversityProgramMetadataTable,
      vocationalCenterMetadataTable
    ],
    environment: {
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      INSTITUTE_METADATA_TABLE_NAME: instituteMetadata.tableName,
      EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
      PROGRAM_METADATA_TABLE_NAME: programMetadataTable.tableName,
      UNIVERSITY_METADATA_TABLE_NAME: UniversityProgramMetadataTable.tableName,
      VOCATIONAL_CENTER_METADATA_TABLE_NAME: vocationalCenterMetadataTable.tableName,
      BUCKET_NAME: bucket.bucketName
    },
    bind: [syncTopic]
  });
  const triggerExtractLambda = new Function(stack, "triggerExtractLambda", {
    handler: "packages/functions/src/bedrock/triggerExtractLambda.handler",
    timeout: "300 seconds",
    permissions: [
      bucket,
      "bedrock",
      "textract",
      fileMetadataTable,
      instituteMetadata,
      extractMetadataQueue,
      programMetadataTable,
      UniversityProgramMetadataTable,
      vocationalCenterMetadataTable,
      "lambda:InvokeFunction"
    ],
    environment: {
      SCHOOL_LAMBDA_FUNCTION_NAME: extractReportMetadata.functionName,
      UNIVERSITY_LAMBDA_FUNCTION_NAME: extractUniversityMetadata.functionName,
      PROGRAM_LAMBDA_FUNCTION_NAME: extractProgramMetadata.functionName,
      VOCATIONAL_LAMBDA_FUNCTION_NAME: extractVocationalCentreMetadata.functionName,
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      INSTITUTE_METADATA_TABLE_NAME: instituteMetadata.tableName,
      EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
      PROGRAM_METADATA_TABLE_NAME: programMetadataTable.tableName,
      UNIVERSITY_METADATA_TABLE_NAME: UniversityProgramMetadataTable.tableName,
      VOCATIONAL_CENTER_METADATA_TABLE_NAME: vocationalCenterMetadataTable.tableName,
      BUCKET_NAME: bucket.bucketName
    }
    // bind: [syncTopic],
  });
  extractMetadataQueue.addConsumer(stack, {
    function: triggerExtractLambda
  });
  const textractQueue = new Queue(stack, "TextractQueue", {
    cdk: {
      queue: {
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: toCdkDuration("301 seconds")
      }
    }
  });
  const textractHandler = new Function(stack, "TextractHandler", {
    handler: "packages/functions/src/lambda/textract.handler",
    environment: {
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      BUCKET_NAME: bucket.bucketName,
      TEXTRACT_QUEUE_URL: textractQueue.queueUrl,
      EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl
    },
    permissions: [
      fileMetadataTable,
      bucket,
      textractQueue,
      extractMetadataQueue,
      "textract:StartDocumentTextDetection",
      "textract:StartDocumentAnalysis",
      "textract:GetDocumentTextDetection",
      "textract:GetDocumentAnalysis"
    ]
  });
  textractQueue.addConsumer(stack, {
    function: textractHandler
  });
  const splitPDFQueue = new Queue(stack, "PDFSplitQueue", {
    cdk: {
      queue: {
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: toCdkDuration("301 seconds")
      }
    }
  });
  const splitPDFHandler = new Function(stack, "SplitPDFHandler", {
    handler: "packages/functions/src/lambda/splitPDF.handler",
    environment: {
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      SPLIT_QUEUE_URL: splitPDFQueue.queueUrl,
      TEXTRACT_QUEUE_URL: textractQueue.queueUrl
    },
    permissions: [fileMetadataTable, bucket, splitPDFQueue, textractQueue]
  });
  splitPDFQueue.addConsumer(stack, {
    function: splitPDFHandler
  });
  const sendSplitMessage = new Function(stack, "SendMessage", {
    handler: "packages/functions/src/lambda/splitPDF.sendMessage",
    environment: {
      FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
      SPLIT_QUEUE_URL: splitPDFQueue.queueUrl
    },
    permissions: [fileMetadataTable, bucket, splitPDFQueue]
  });
  bucket.addNotifications(stack, {
    objectCreatedNotification: {
      function: sendSplitMessage,
      events: ["object_created"],
      filters: [{ prefix: "Files/" }, { suffix: ".pdf" }]
      // Only for PDF files in the "Files/" folder
    }
  });
  const processCSVHandler = new Function(stack, "ProcessCSVHandler", {
    handler: "packages/functions/src/lambda/processCSV.handler",
    environment: {
      SCHOOL_REVIEWS_TABLE_NAME: SchoolReviewsTable.tableName,
      HIGHER_EDUCATION_PROGRAMME_REVIEWS_TABLE_NAME: HigherEducationProgrammeReviewsTable.tableName,
      NATIONAL_FRAMEWORK_OPERATIONS_TABLE_NAME: NationalFrameworkOperationsTable.tableName,
      VOCATIONAL_REVIEWS_TABLE_NAME: VocationalReviewsTable.tableName,
      UNIVERSITY_REVIEWS_TABLE_NAME: UniversityReviewsTable.tableName
    },
    permissions: [SchoolReviewsTable, HigherEducationProgrammeReviewsTable, NationalFrameworkOperationsTable, VocationalReviewsTable, UniversityReviewsTable]
  });
  bucket.addNotifications(stack, {
    objectCreatedNotification: {
      function: processCSVHandler,
      events: ["object_created"],
      filters: [{ prefix: "CSVFiles/" }, { suffix: ".csv" }]
    }
  });
  const bedrockOutputBucket = new Bucket(stack, "BedrockOutputBucket", {
    cdk: {
      bucket: {
        versioned: true,
        // Enable versioning
        removalPolicy: stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        publicReadAccess: true
      }
    },
    cors: [
      {
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST"],
        // Allowed HTTP methods
        allowedOrigins: ["*"],
        // TODO: Replace "*" with your frontend's domain for production
        exposedHeaders: ["ETag"],
        maxAge: "3000 seconds"
      }
    ]
  });
  stack.addOutputs({
    BucketName: bucket.bucketName,
    BedrockOutputBucket: bedrockOutputBucket.bucketName,
    QueueURL: splitPDFQueue.queueUrl,
    SyncTopic: syncTopic.topicName
  });
  return { bucket, bedrockOutputBucket, queue: splitPDFQueue, syncTopic };
}
__name(S3Stack, "S3Stack");

// stacks/BedrockStack.ts
import { aws_bedrock as bedrock, aws_iam as iam } from "aws-cdk-lib";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
function BedrockStack({ stack, app }) {
  const { bucket, syncTopic } = use2(S3Stack);
  const storageConfigurationProperty = {
    type: "OPENSEARCH_SERVERLESS",
    // the properties below are optional
    opensearchServerlessConfiguration: {
      collectionArn: "arn:aws:aoss:us-east-1:588738578192:collection/tl3oyze7ocph2xyqb54i",
      fieldMapping: {
        metadataField: "AMAZON_BEDROCK_METADATA",
        textField: "AMAZON_BEDROCK_TEXT_CHUNK",
        vectorField: "bedrock-knowledge-base-default-vector"
      },
      vectorIndexName: "bedrock-knowledge-base-default-index"
    }
  };
  const cfnKnowledgeBase = new bedrock.CfnKnowledgeBase(stack, "KnowledgeBaseSST", {
    knowledgeBaseConfiguration: {
      type: "VECTOR",
      vectorKnowledgeBaseConfiguration: {
        embeddingModelArn: "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0",
        // the properties below are optional
        embeddingModelConfiguration: {
          bedrockEmbeddingModelConfiguration: {
            dimensions: 1024
          }
        }
      }
    },
    name: "KnowledgeBaseSST-" + app.stage,
    roleArn: "arn:aws:iam::588738578192:role/service-role/AmazonBedrockExecutionRoleForKnowledgeBase_duktm",
    storageConfiguration: storageConfigurationProperty
  });
  const amazonBedrockExecutionRoleForAgents = new iam.Role(stack, "amazonBedrockExecutionRoleForAgents", {
    assumedBy: new ServicePrincipal("bedrock.amazonaws.com")
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
  const cfnDataSource = new bedrock.CfnDataSource(stack, "KnowledgeBaseSSTDataSource", {
    dataSourceConfiguration: {
      type: "S3",
      s3Configuration: {
        bucketArn: bucket.bucketArn,
        // the properties below are optional
        bucketOwnerAccountId: stack.account,
        inclusionPrefixes: ["TextFiles/"]
      }
    },
    knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,
    name: `KnowledgeBaseSSTDataSource-${app.stage}`
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
  var cfnAgent = void 0;
  cfnAgent = new bedrock.CfnAgent(
    stack,
    "BQACfnAgent",
    {
      agentName: "BQAInsightAIModel-" + app.stage,
      // agentResourceRoleArn: 'arn:aws:iam::588738578192:role/service-role/AmazonBedrockExecutionRoleForAgents_GQ6EX8SHLRV',
      agentResourceRoleArn: amazonBedrockExecutionRoleForAgents.roleArn,
      foundationModel: "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
      idleSessionTtlInSeconds: 600,
      instruction: "Analyze All reports and produce powerful insights based on that data. Generate data in tables if prompted to as well.",
      knowledgeBases: [{
        description: "Use the newest data as default, unless it is specified otherwise",
        knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,
        knowledgeBaseState: "ENABLED"
      }]
    }
  );
  stack.addOutputs({ Agent: cfnAgent.agentName });
  const cfnAgentAlias = new bedrock.CfnAgentAlias(stack, "BQACfnAgentAlias", {
    agentAliasName: "BQACfnAgentAlias-" + app.stage,
    agentId: cfnAgent?.attrAgentId || ""
  });
  var cfnAgentLlama = void 0;
  cfnAgentLlama = new bedrock.CfnAgent(
    stack,
    "BQACfnAgentLlama",
    {
      agentName: "BQAInsightAIModelLlama-" + app.stage,
      // agentResourceRoleArn: 'arn:aws:iam::588738578192:role/service-role/AmazonBedrockExecutionRoleForAgents_GQ6EX8SHLRV',
      agentResourceRoleArn: amazonBedrockExecutionRoleForAgents.roleArn,
      foundationModel: "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
      idleSessionTtlInSeconds: 600,
      instruction: "Analyze All reports and produce powerful insights based on that data. Generate data in tables if prompted to as well.",
      knowledgeBases: [{
        description: "Use the newest data as default, unless it is specified otherwise",
        knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,
        knowledgeBaseState: "ENABLED"
      }]
    }
  );
  stack.addOutputs({ AgentLLama: cfnAgentLlama.agentName });
  const cfnAgentAliasLlama = new bedrock.CfnAgentAlias(stack, "BQACfnAgentAliasLlama", {
    agentAliasName: "BQACfnAgentAliasLlama-" + app.stage,
    agentId: cfnAgentLlama?.attrAgentId || ""
  });
  syncTopic.addSubscribers(stack, {
    sync: {
      function: {
        handler: "packages/functions/src/bedrock/sync.syncKnowlegeBase",
        timeout: 120,
        environment: {
          KNOWLEDGE_BASE_ID: cfnKnowledgeBase.attrKnowledgeBaseId,
          DATASOURCE_BASE_ID: cfnDataSource.attrDataSourceId
        },
        permissions: ["bedrock"]
      }
    }
  });
  stack.addOutputs({
    KnowledgeBase: cfnKnowledgeBase.name,
    DataSource: cfnDataSource.name
  });
  return { cfnKnowledgeBase, cfnDataSource, cfnAgent, cfnAgentAlias, cfnAgentLlama, cfnAgentAliasLlama };
}
__name(BedrockStack, "BedrockStack");

// stacks/Lexstacks/BotStack.ts
function BotStack({ stack }) {
  const { cfnKnowledgeBase, cfnDataSource, cfnAgent, cfnAgentAlias, cfnAgentLlama, cfnAgentAliasLlama } = use3(BedrockStack);
  const provider = new LexCustomResource(
    stack,
    "LexV2CfnCustomResource",
    {
      semanticVersion: "0.3.0",
      logLevel: "INFO"
    }
  );
  const botDefinition = new LexBotDefinition(
    stack,
    "BQABot",
    provider.serviceToken(),
    {
      botName: stack.stackName + "-BQA-Bot",
      dataPrivacy: {
        childDirected: false
      },
      description: "Educational Institute Comparison and Analysis Bot for BQA",
      idleSessionTTLInSeconds: 300,
      roleArn: provider.serviceLinkedRoleArn()
    }
  );
  const locale = botDefinition.addLocale({
    localeId: "en_US",
    nluIntentConfidenceThreshold: 0.4,
    voiceSettings: {
      voiceId: "Ivy"
    }
  });
  locale.addSlotType({
    slotTypeName: "BQASlotType",
    description: "This is compare Slot type",
    valueSelectionSetting: {
      resolutionStrategy: "OriginalValue"
    },
    slotTypeValues: [
      { sampleValue: { value: "Analyze" } },
      { sampleValue: { value: "Compare" } },
      { sampleValue: { value: "Other" } }
    ]
  });
  locale.addSlotType({
    slotTypeName: "InstituteSlotType",
    description: "Slot for institute name",
    valueSelectionSetting: {
      resolutionStrategy: "OriginalValue"
    },
    slotTypeValues: [
      { sampleValue: { value: "Institute" } }
    ]
  });
  const BQAIntent = locale.addIntent({
    intentName: "BQAIntent",
    description: "Main intent for educational institute comparison and analysis",
    sampleUtterances: [
      { utterance: "Hello BQA" },
      { utterance: "Hello" },
      { utterance: "Hi" },
      { utterance: "Hi BQA" },
      { utterance: "Back" },
      // Added Back utterance
      { utterance: "Back to the main menu" },
      // Added Back to main menu utterance
      { utterance: "Start over" },
      // Added for additional clarity
      { utterance: "Return to menu" }
    ],
    fulfillmentCodeHook: {
      enabled: true
    }
  });
  BQAIntent.addSlot({
    slotName: "BQASlot",
    slotTypeName: "BQASlotType",
    description: "The main menu of BQA",
    valueElicitationSetting: {
      slotConstraint: "Required",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              imageResponseCard: {
                buttons: [
                  {
                    text: "Analyze",
                    value: "Analyze"
                  },
                  {
                    text: "Compare",
                    value: "Compare"
                  },
                  {
                    text: "Other",
                    value: "Other"
                  }
                ],
                subtitle: "What would you like me to do for you?",
                title: "Learn About Educational Institutes"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  const analyzingIntent = locale.addIntent({
    intentName: "AnalyzingIntent",
    description: "Provide information about analyzing educational institutes",
    sampleUtterances: [
      { utterance: "Tell me more about analyzing" }
    ],
    fulfillmentCodeHook: {
      enabled: true
    }
  });
  analyzingIntent.addSlot({
    slotName: "InstituteTypeSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Type of educational institute to analyze",
    valueElicitationSetting: {
      slotConstraint: "Required",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              imageResponseCard: {
                buttons: [
                  {
                    text: "University",
                    value: "University"
                  },
                  {
                    text: "School",
                    value: "School"
                  },
                  {
                    text: "Vocational training center",
                    value: "Vocational training center"
                  }
                ],
                title: "Which type of educational institute would you like to analyze?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  analyzingIntent.addSlot({
    slotName: "AnalyzeUniversitySlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Analyzing universitie",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              imageResponseCard: {
                title: "Do you want to analyze based on program or standard??",
                buttons: [
                  {
                    text: "Program",
                    value: "Program"
                  },
                  {
                    text: "Standard",
                    value: "Standard"
                  }
                ]
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  analyzingIntent.addSlot({
    slotName: "ProgramNameSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Analyzing Universities based on program",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "write the name of the program and the university you want to analyze."
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  analyzingIntent.addSlot({
    slotName: "StandardProgSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Standard to analyze",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What is the standard of the specific program?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  const uniStandard = locale.addIntent({
    intentName: "StandardIntent",
    description: "Intent about standards for universitites",
    sampleUtterances: [
      { utterance: "Standard" }
    ],
    fulfillmentCodeHook: {
      enabled: true
    }
  });
  uniStandard.addSlot({
    slotName: "StandardSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Standard to analyze",
    valueElicitationSetting: {
      slotConstraint: "Required",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What is the standard for analysis?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  analyzingIntent.addSlot({
    slotName: "AnalyzeSchoolSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Analyzing Schools for BQA",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What is the name of the school you want to analyze?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  analyzingIntent.addSlot({
    slotName: "SchoolAspectSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "school aspect for BQA",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "what is the aspect you want?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  analyzingIntent.addSlot({
    slotName: "AnalyzeVocationalSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Analyzing Vocational training centers for BQA",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What is the name of the Vocational training center you want to analyze?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  analyzingIntent.addSlot({
    slotName: "VocationalAspectSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "vocational aspect for BQA",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "what is the aspect you want?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  const comparingIntent = locale.addIntent({
    intentName: "ComparingIntent",
    description: "Provide information about comparing educational institutes",
    sampleUtterances: [
      { utterance: "Tell me more about comparing" }
    ],
    fulfillmentCodeHook: {
      enabled: true
    }
  });
  comparingIntent.addSlot({
    slotName: "InstituteCompareTypeSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Type of educational institute to analyze",
    valueElicitationSetting: {
      slotConstraint: "Required",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              imageResponseCard: {
                buttons: [
                  {
                    text: "University",
                    value: "University"
                  },
                  {
                    text: "School",
                    value: "School"
                  },
                  {
                    text: "Vocational training center",
                    value: "Vocational training center"
                  }
                ],
                title: "Which type of educational institute would you like to compare?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "CompareUniversitySlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Compare universities based on universities or program",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              imageResponseCard: {
                title: "would you like to compare universties or programs within universities?",
                buttons: [
                  {
                    text: "Universities",
                    value: "Universities"
                  },
                  {
                    text: "Programs",
                    value: "Programs"
                  }
                ]
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "CompareUniversityWUniSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "names of universities to compare",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "what are the names of universites you would like to compare"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "CompareUniversityWProgramsSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "names of universities to compare",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What are the programs you would like to compare? You can choose any program from any university in Bahrain"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "CompareSchoolSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Compare schools for BQA",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              imageResponseCard: {
                title: "Based on what you would like to compare schools?",
                buttons: [
                  {
                    text: "Governorate",
                    value: "Governorate"
                  },
                  {
                    text: "Specific Institutes",
                    value: "Specific Institutes"
                  },
                  {
                    text: "All Government Schools",
                    value: "All Government Schools"
                  },
                  {
                    text: "All Private Schools",
                    value: "All Private Schools"
                  }
                ]
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "GovernorateSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "Select the governorate to compare institutes",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              imageResponseCard: {
                title: "Which governorate institutes would you like to compare?",
                buttons: [
                  {
                    text: "Capital Governorate",
                    value: "Capital Governorate"
                  },
                  {
                    text: "Muharraq Governorate",
                    value: "Muharraq Governorate"
                  },
                  {
                    text: "Northern Governorate",
                    value: "Northern Governorate"
                  },
                  {
                    text: "Southern Governorate",
                    value: "Southern Governorate"
                  }
                ]
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "CompareSpecificInstitutesSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "names of specific institutes to compare",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What are the names of institutes you would like to compare?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "CompareVocationalSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "name of vocational training center to compare",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What is the names of the Vocational training centers you want to compare?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  comparingIntent.addSlot({
    slotName: "CompareVocationalaspectSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "name of vocational training center to compare",
    valueElicitationSetting: {
      slotConstraint: "Optional",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What is the aspects of Vocational training centers you want to compare?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  const otherIntent = locale.addIntent({
    intentName: "OtherIntent",
    description: "Handle other inquiries about educational institutes",
    sampleUtterances: [
      { utterance: "I have another question" },
      { utterance: "Other" }
    ],
    fulfillmentCodeHook: {
      enabled: true
    }
  });
  otherIntent.addSlot({
    slotName: "OtherQuestionsSlot",
    slotTypeName: "AMAZON.FreeFormInput",
    description: "The user's other questions",
    valueElicitationSetting: {
      slotConstraint: "Required",
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: "What are the questions in your mind?"
              }
            }
          }
        ],
        maxRetries: 2
      }
    }
  });
  const bot = botDefinition.build();
  const version = bot.automaticVersion();
  const fulfillmentPermission = {
    action: "lambda:InvokeFunction",
    principal: new iam2.ServicePrincipal("lex.amazonaws.com")
  };
  const fulfillmentPrincipal = new ServicePrincipal2("lex.amazonaws.com");
  const fulfillmentFunction = new lambda.Function(stack, "Fulfillment-Lambda", {
    functionName: stack.stage + "-fulfillment-lambda-for-lex-bot",
    runtime: lambda.Runtime.PYTHON_3_11,
    handler: "intentAmazonLexFulfillment.lambda_handler",
    memorySize: 512,
    timeout: Duration.seconds(60),
    // code: lambda.Code.fromInline('print("Hello World")'),
    code: lambda.Code.fromAsset("packages/functions/src/LexBot/"),
    environment: {
      agentId: cfnAgent.attrAgentId,
      agentAliasId: cfnAgentAlias.attrAgentAliasId,
      KNOWLEDGEBASE_ID: cfnKnowledgeBase.attrKnowledgeBaseId,
      llamaAgentId: cfnAgentLlama.attrAgentId,
      llamaAgentAliasId: cfnAgentAliasLlama.attrAgentAliasId
    }
  });
  fulfillmentFunction.addToRolePolicy(new iam2.PolicyStatement(
    {
      effect: iam2.Effect.ALLOW,
      actions: [
        "bedrock:invokeModel"
      ],
      resources: ["arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"]
    }
  ));
  fulfillmentFunction.addToRolePolicy(new iam2.PolicyStatement(
    {
      effect: iam2.Effect.ALLOW,
      actions: [
        "bedrock:InvokeAgent",
        "bedrock:*"
      ],
      resources: ["*"]
      // TODO: change it to be dynamic
    }
  ));
  fulfillmentFunction.grantInvoke(fulfillmentPrincipal);
  fulfillmentFunction.addPermission("lex-fulfillment", fulfillmentPermission);
  const alias = bot.addAlias({
    botAliasName: "liveAlias",
    botVersion: version.botVersion(),
    botAliasLocaleSettings: {
      en_US: {
        codeHookSpecification: {
          lambdaCodeHook: {
            codeHookInterfaceVersion: "1.0",
            lambdaARN: fulfillmentFunction.functionArn
          }
        },
        enabled: true
      }
    }
  });
  return {
    bot,
    alias
  };
}
__name(BotStack, "BotStack");

// sst.config.ts
var sst_config_default = {
  config(_input) {
    return {
      name: "insight-ai",
      region: "us-east-1"
    };
  }
};
export {
  BotStack,
  sst_config_default as default
};
