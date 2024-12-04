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

    //Create an SQS Queue for Textract
    const textractQueue = new Queue(stack, "TextractQueue", {
        consumer: {
            function: {
                handler: "packages/functions/src/lambda/textract.handler",
                environment: {
                    FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
                    BUCKET_NAME: bucket.bucketName,
                },
                permissions: [
                    fileMetadataTable,  // Allow access to the DynamoDB table
                    bucket,              // Allow access to the S3 bucket
                    "textract:StartDocumentTextDetection",  // Allow Textract text detection
                    "textract:StartDocumentAnalysis",      // Allow Textract document analysis
                    "textract:GetDocumentTextDetection",  // Allow Textract to get text detection results
                    "textract:GetDocumentAnalysis",       // Allow Textract to get analysis results
                ],
            },
        },
        cdk: {
            queue: {
                fifo: true,
                contentBasedDeduplication: true,
                visibilityTimeout: toCdkDuration("301 seconds"),
            },
        },
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
        permissions: [fileMetadataTable, bucket, splitPDFqueue, textractQueue], // Grant permissions to the function
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
        permissions: [fileMetadataTable, bucket, splitPDFqueue], // Grant permissions to the function
    });


    // Add S3 event notification to trigger the SQS queue on object creation
    bucket.addNotifications(stack, {
        objectCreatedNotification: {
            function: sendSplitMessage, // Send notifications to the SQS queue
            events: ["object_created"], // Only trigger on object creation (uploads)
            filters: [{ prefix: "Files/" }, { suffix: ".pdf" }], // Only for PDF files in the "Files/" folder
        },
    });

    // Add outputs for the bucket and queue
    stack.addOutputs({
        BucketName: bucket.bucketName,
        QueueURL: splitPDFqueue.queueUrl,
    });

    return { bucket, queue: splitPDFqueue };
}
