import { StackContext, Bucket, Function, Queue, use, toCdkDuration } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { FileMetadataStack } from "./FileMetadataStack";

export function S3Stack({ stack }: StackContext) {
    const { fileMetadataTable } = use(FileMetadataStack);

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
        },
        permissions: [
            fileMetadataTable,    
            bucket,                
            textractQueue,
            fileMetadataTable,        
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
    const splitPDFqueue = new Queue(stack, "PDFSplitQueue", {
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
            SPLIT_QUEUE_URL: splitPDFqueue.queueUrl,
            TEXTRACT_QUEUE_URL: textractQueue.queueUrl,
        },
        permissions: [fileMetadataTable, bucket, splitPDFqueue, textractQueue], 
    });

    // Set the consumer for the queue
    splitPDFqueue.addConsumer(stack, {
        function: splitPDFHandler,
    });

    // Create the PDF split handler function
    const sendSplitMessage = new Function(stack, "SendMessage", {
        handler: "packages/functions/src/lambda/splitPDF.sendMessage",
        environment: {
            FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
            SPLIT_QUEUE_URL: splitPDFqueue.queueUrl, 
        },
        permissions: [fileMetadataTable, bucket, splitPDFqueue], 
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
        QueueURL: splitPDFqueue.queueUrl,
    });

    return { bucket, bedrockOutputBucket, queue: splitPDFqueue };
}
