import { StackContext, Bucket, Queue, Function, use, toCdkDuration } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { FileMetadataStack } from "./FileMetadataStack";

export function S3Stack({ stack }: StackContext) {
    // Reference the DynamoDB table from FileMetadataStack
    const { fileMetadataTable } = use(FileMetadataStack);

    // Create an SQS queue
    const queue = new Queue(stack, "PDFProcessingQueue", {
        cdk: {
            queue: {
                visibilityTimeout: toCdkDuration("300 seconds"), // Set visibility timeout to 5 minutes
            },
        },
    });

    // Create an SST Bucket with versioning, CORS
    const bucket = new Bucket(stack, "ReportBucket", {
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
        notifications: {
            // Directly send notifications to the SQS queue
            objectCreated: {
                type: "queue",
                queue: queue, // SQS queue for notifications
                events: ["object_created"], // Trigger on object creation
                filters: [{ prefix: "Files/" }], // Only trigger for objects under the `Files/` directory
            },
        },
    });

    // Define the Lambda function for processing PDF splitting
    const splitPDFHandler = new Function(stack, "SplitPDFHandler", {
        handler: "packages/functions/src/lambda/splitPDF.handler",
        environment: {
            FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
            queueUrl: queue.queueUrl,
        },
        permissions: [fileMetadataTable, bucket, queue], // Grant Lambda permissions for S3 and the queue
    });

    // Attach the Lambda function as a consumer of the queue
    queue.addConsumer(stack, {
        function: splitPDFHandler,
    });

    // Add outputs for the bucket and the queue
    stack.addOutputs({
        BucketName: bucket.bucketName,
        QueueURL: queue.queueUrl,
    });

    return { bucket, queue };
}
