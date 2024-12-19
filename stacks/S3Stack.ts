import { StackContext, Bucket, Function, Queue, use, toCdkDuration } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { FileMetadataStack } from "./FileMetadataStack";
import { InstituteMetadataStack } from "./InstituteMetadataStack";
export function S3Stack({ stack }: StackContext) {
    const { fileMetadataTable } = use(FileMetadataStack);
    const {instituteMetadata} = use (InstituteMetadataStack);

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


    const extractMetadataQueue = new Queue(stack, "extractMetadataQueue", {
        cdk: {
            queue: {
                fifo: true,
                contentBasedDeduplication: true,
                visibilityTimeout: toCdkDuration("301 seconds"),
            },
        },
    });

    const extractReportMetadata = new Function(stack, "claudeUniversityMetadata", {
        handler: "packages/functions/src/bedrock/claudeUniversityMetadata.handler",
        timeout: "300 seconds",
        permissions: [
            bucket, "bedrock", "textract" , fileMetadataTable , instituteMetadata, extractMetadataQueue
        ],
        environment: {
        FILE_METADATA_TABLE_NAME : fileMetadataTable.tableName,
        INSTITUTE_METADATA_TABLE_NAME : instituteMetadata.tableName,
        EXTRACT_METADATA_QUEUE_URL: extractMetadataQueue.queueUrl,
        }
    });

    extractMetadataQueue.addConsumer(stack, {
        function: extractReportMetadata,
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

    const bedrockOutputBucket = new Bucket(stack, "BedrockOutputBucket", {
        cdk: {
            bucket: {
                versioned: true, // Enable versioning
                removalPolicy: stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
                publicReadAccess: true,
            },
        },
        cors: [
            {
                allowedHeaders: ["*"],
                allowedMethods: ["GET", "PUT", "POST"], // Allowed HTTP methods
                allowedOrigins: ["*"], // TODO: Replace "*" with your frontend's domain for production
                exposedHeaders: ["ETag"],
                maxAge: "3000 seconds",
            },
        ],
    });


    // Add outputs for the bucket
    stack.addOutputs({
        BucketName: bucket.bucketName,
        BedrockOutputBucket: bedrockOutputBucket.bucketName,
        QueueURL: splitPDFQueue.queueUrl,
    });

    return { bucket, bedrockOutputBucket, queue: splitPDFQueue };
}
