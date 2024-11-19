import { StackContext, Bucket, use, Queue, Function, toCdkDuration } from "sst/constructs";
import { BlockPublicAccess, HttpMethods } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";
import { FileMetadataStack } from "./FileMetadataStack";

export function S3Stack({ stack }: StackContext) {
    // Reference the DynamoDB table from FileMetadataStack
    const { fileMetadataTable } = use(FileMetadataStack);

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
    });

    // Create an SQS queue
    const queue = new Queue(stack, "PDFSplitQueue", {
        cdk: {
            queue: {
                visibilityTimeout: toCdkDuration("300 seconds"), // Set visibility timeout to 5 minutes
            },
        },
    });

    // Add the consumer Lambda function to the queue
    queue.addConsumer(stack, {
        function: {
            handler: "packages/functions/src/lambda/splitPDF.handler",
            environment: {
                FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
            },
            permissions: [bucket, fileMetadataTable],
        },
    });

    // Define a Lambda function to send messages to the queue
    const sendMessage = new Function(stack, "SendMessage", {
        handler: "packages/functions/src/lambda/sendSplitMessage.handler",
        environment: {
            SQS_QUEUE_URL: queue.cdk.queue.queueUrl,
        },
        permissions: [queue],
    });

    // Add S3 notification to trigger the SendMessage function
    bucket.addNotifications(stack, {
        objectCreated: {
            function: sendMessage,
            events: ["object_created"],
            filters: [{ prefix: "Files/" }], // Only trigger for objects under the "Files/" prefix
        },
    });

    // Add outputs for the bucket and the queue
    stack.addOutputs({
        BucketName: bucket.bucketName,
        QueueURL: queue.queueUrl, // Output the queue URL
    });

    return { bucket, queue };
}
