import { StackContext, Bucket, Function, Queue, use, toCdkDuration, Topic } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { FileMetadataStack } from "./FileMetadataStack";
import { InstituteMetadataStack } from "./InstituteMetadataStack";
import { ProgramMetadataStack } from "./ProgramMetadataStack";
import { UniversityProgramMetadataStack } from "./UniversityProgramMetadataStack";
import { OpenDataStack } from "./OpenDataStack";
import { VocationalCentersMetadataStack } from "./VocationalCentersMetadataStack";
export function S3Stack({ stack }: StackContext) {
// Importing table resources from various stacks to reference in the application
    const {fileMetadataTable } = use(FileMetadataStack); //Handles metadata related to uploaded files.
    const {instituteMetadata} = use (InstituteMetadataStack); //Stores metadata about schools 
    const {programMetadataTable} = use(ProgramMetadataStack); //Contains data related to university programs.
    const {UniversityProgramMetadataTable} = use(UniversityProgramMetadataStack); // Manages metadata for universities specifically.
    const {vocationalCenterMetadataTable} = use(VocationalCentersMetadataStack); //Holds metadata for vocational training centers.
    const { SchoolReviewsTable, VocationalReviewsTable, UniversityReviewsTable } = use(OpenDataStack);

    // Create an SST Bucket with versioning and CORS
    const bucket = new Bucket(stack, "ReportBucket", {
        cdk: {
            bucket: {
                versioned: true,
                removalPolicy: stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
                publicReadAccess: true,
            },
        },
        cors: [
            {
                allowedHeaders: ["*"],
                allowedMethods: ["GET", "PUT", "POST"],
                allowedOrigins: ["*"],
                exposedHeaders: ["ETag"],
                maxAge: "3000 seconds",
            },
        ],
    });

    // create SNS topic to sync knowledgebase
    const syncTopic = new Topic(stack, "SyncTopic", {
        subscribers: {
        }
    })

    const extractMetadataQueue = new Queue(stack, "extractMetadataQueue", {
        cdk: {
            queue: {
                fifo: true,
                contentBasedDeduplication: true,
                visibilityTimeout: toCdkDuration("301 seconds"),
            },
        },
    });

//Lambda function to extract university metadata using Claude AI
    const extractUniversityMetadata = new Function(stack, "claudeUniversityMetadata", {
        // Specify the function handler location
        handler: "packages/functions/src/bedrock/claudeUniversityMetadata.handler",
        timeout: "300 seconds", // Set the timeout to allow up to 300 seconds for execution
         // Grant permission to the lambda function to access the required AWS services
        permissions: [
            bucket, "bedrock", "textract" , fileMetadataTable , extractMetadataQueue, UniversityProgramMetadataTable
        ],
        //Define the environment variables with table and bucket names to be used in the Lambda function
        environment: {
        FILE_METADATA_TABLE_NAME : fileMetadataTable.tableName,
        EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
        UNIVERSITY_METADATA_TABLE_NAME : UniversityProgramMetadataTable.tableName,
        BUCKET_NAME: bucket.bucketName
        },
        bind: [syncTopic] // Bind the sync topic to enable triggering or event handling
    });

   
//Lambda function to extract vocational training centers metadata using Claude AI
    const extractVocationalCentreMetadata = new Function(stack, "claudeVocationalExtractMetadata", {
        // Specify the function handler location
        handler: "packages/functions/src/bedrock/claudeVocationalExtractMetadata.handler",
        timeout: "300 seconds", // Set the timeout to allow up to 300 seconds for execution
        // Grant permission to the lambda function to access the required AWS services
        permissions: [
            bucket, "bedrock", "textract" , fileMetadataTable , extractMetadataQueue, vocationalCenterMetadataTable
        ],
        //Define the environment variables with table and bucket names to be used in the Lambda function
        environment: {
        FILE_METADATA_TABLE_NAME : fileMetadataTable.tableName,
        EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
        VOCATIONAL_CENTER_METADATA_TABLE_NAME : vocationalCenterMetadataTable.tableName,
        BUCKET_NAME: bucket.bucketName
        },
        bind: [syncTopic]
    });

//Lambda function to extract programs within universities metadata using Claude AI
    const extractProgramMetadata = new Function(stack, "claudeProgramMetadata", {
        // Specify the function handler location
        handler: "packages/functions/src/bedrock/claudeProgramMetadata.handler",
        timeout: "300 seconds", // Set the timeout to allow up to 300 seconds for execution
        // Grant permission to the lambda function to access the required AWS services
        permissions: [
            bucket, "bedrock", "textract" , fileMetadataTable , extractMetadataQueue, programMetadataTable
        ],
        //Define the environment variables with table and bucket names to be used in the Lambda function
        environment: {
        FILE_METADATA_TABLE_NAME : fileMetadataTable.tableName,
        EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
        PROGRAM_METADATA_TABLE_NAME : programMetadataTable.tableName,
        BUCKET_NAME: bucket.bucketName,
        },
        bind: [syncTopic]
    });

//Lambda function to extract schools metadata using Claude AI
    const extractReportMetadata = new Function(stack, "claudeExtractReportMetadata", {
        // Specify the function handler location
        handler: "packages/functions/src/bedrock/claudeExtractReportMetadata.handler",
        timeout: "300 seconds", // Set the timeout to allow up to 300 seconds for execution
        // Grant permission to the lambda function to access the required AWS services
        permissions: [
            bucket, "bedrock", "textract" , fileMetadataTable , instituteMetadata, extractMetadataQueue
        ],
        //Define the environment variables with table and bucket names to be used in the Lambda function
        environment: {
        FILE_METADATA_TABLE_NAME : fileMetadataTable.tableName,
        INSTITUTE_METADATA_TABLE_NAME : instituteMetadata.tableName,
        EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
        BUCKET_NAME: bucket.bucketName
        },
        bind: [syncTopic]
    });

//Lambda function that manages the process of invoking the institutes' Lambda functions based on the report type
    const triggerExtractLambda = new Function(stack, "triggerExtractLambda", {
        // Specify the function handler location
        handler: "packages/functions/src/bedrock/triggerExtractLambda.handler",
        timeout: "300 seconds", // Set the timeout to allow up to 300 seconds for execution
        // Grant permission to the lambda function to access the required AWS services
        permissions: [
            bucket, "bedrock", "textract" , fileMetadataTable , instituteMetadata, extractMetadataQueue, programMetadataTable, UniversityProgramMetadataTable, vocationalCenterMetadataTable, "lambda:InvokeFunction"
        ],
        //Define the environment variables with lambda functions and bucket names to be used in the Lambda function
        environment: {
        SCHOOL_LAMBDA_FUNCTION_NAME : extractReportMetadata.functionName,
        UNIVERSITY_LAMBDA_FUNCTION_NAME : extractUniversityMetadata.functionName,
        PROGRAM_LAMBDA_FUNCTION_NAME: extractProgramMetadata.functionName,
        VOCATIONAL_LAMBDA_FUNCTION_NAME: extractVocationalCentreMetadata.functionName,
        EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
        BUCKET_NAME: bucket.bucketName
        },
    });

    extractMetadataQueue.addConsumer(stack, {
        function: triggerExtractLambda,
    });


    // Create the SQS Queue for Textract processing
    const textractQueue = new Queue(stack, "TextractQueue", {
        cdk: {
            queue: {
                fifo: true,
                contentBasedDeduplication: true,
                visibilityTimeout: toCdkDuration("301 seconds"),
            },
        },
    });

    // Create the Textract handler function
    const textractHandler = new Function(stack, "TextractHandler", {
        handler: "packages/functions/src/lambda/textract.handler", 
        environment: {
            FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName, 
            BUCKET_NAME: bucket.bucketName,                         
            TEXTRACT_QUEUE_URL: textractQueue.queueUrl,
            EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,            
        },
        permissions: [
            fileMetadataTable,    
            bucket,                
            textractQueue,
            extractMetadataQueue,        
            "textract:StartDocumentTextDetection", 
            "textract:StartDocumentAnalysis",     
            "textract:GetDocumentTextDetection", 
            "textract:GetDocumentAnalysis",     
        ],
    });

    // Set the consumer for the Textract queue
    textractQueue.addConsumer(stack, {
        function: textractHandler,
    });

    // Create an SQS Queue for PDF splitting
    const splitPDFQueue = new Queue(stack, "PDFSplitQueue", {
        cdk: {
            queue: {
                fifo: true,
                contentBasedDeduplication: true,
                visibilityTimeout: toCdkDuration("301 seconds"),
            },
        },
    });

    // Create the PDF split handler function
    const splitPDFHandler = new Function(stack, "SplitPDFHandler", {
        handler: "packages/functions/src/lambda/splitPDF.handler",
        environment: {
            FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
            SPLIT_QUEUE_URL: splitPDFQueue.queueUrl,
            TEXTRACT_QUEUE_URL: textractQueue.queueUrl,
        },
        permissions: [fileMetadataTable, bucket, splitPDFQueue, textractQueue], 
    });

    // Set the consumer for the queue
    splitPDFQueue.addConsumer(stack, {
        function: splitPDFHandler,
    });

    // Create the PDF split handler function
    const sendSplitMessage = new Function(stack, "SendMessage", {
        handler: "packages/functions/src/lambda/splitPDF.sendMessage",
        environment: {
            FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
            SPLIT_QUEUE_URL: splitPDFQueue.queueUrl, 
        },
        permissions: [fileMetadataTable, bucket, splitPDFQueue], 
    });


    // Add S3 event notification to trigger the SQS queue on object creation
    bucket.addNotifications(stack, {
        objectCreatedNotification: {
            function: sendSplitMessage, 
            events: ["object_created"], 
            filters: [{ prefix: "Files/" }, { suffix: ".pdf" }], // Only for PDF files in the "Files/" folder
        },
        
    });

    //Function to process CSV files and store the data in DynamoDB
    const processCSVHandler = new Function(stack, "ProcessCSVHandler", {
        handler: "packages/functions/src/lambda/processCSV.handler",
        environment: {
            SCHOOL_REVIEWS_TABLE_NAME: SchoolReviewsTable.tableName,
            VOCATIONAL_REVIEWS_TABLE_NAME: VocationalReviewsTable.tableName,
            UNIVERSITY_REVIEWS_TABLE_NAME: UniversityReviewsTable.tableName,
        },
        permissions: [SchoolReviewsTable,VocationalReviewsTable,UniversityReviewsTable], 
    });

    // S3 Notification for CSV files
    bucket.addNotifications(stack, {
        objectCreatedNotification: {
            function: processCSVHandler, 
            events: ["object_created"], 
            filters: [{ prefix: "CSVFiles/" }, { suffix: ".csv" }], 
        },
        
    });


    // Add outputs for the bucket
    stack.addOutputs({
        BucketName: bucket.bucketName,
        QueueURL: splitPDFQueue.queueUrl,
        SyncTopic: syncTopic.topicName,
    });

    return { bucket, queue: splitPDFQueue, syncTopic };
}
