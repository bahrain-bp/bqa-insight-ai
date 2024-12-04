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

    // Create an SQS Queue
    const queue = new Queue(stack, "PDFSplitQueue", {
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
            QUEUE_URL: queue.queueUrl, // Pass queue URL to the function environment
        },
        permissions: [fileMetadataTable, bucket, queue], // Grant permissions to the function
    });

    // Set the consumer for the queue
    queue.addConsumer(stack, {
        function: splitPDFHandler,
    });

    // Create the PDF split handler function
    const sendSplitMessage = new Function(stack, "SendMessage", {
        handler: "packages/functions/src/lambda/splitPDF.sendMessage",
        environment: {
            FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
            QUEUE_URL: queue.queueUrl, 
        },
        permissions: [fileMetadataTable, bucket, queue], // Grant permissions to the function
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
        QueueURL: queue.queueUrl,
    });

    return { bucket, queue };
}
