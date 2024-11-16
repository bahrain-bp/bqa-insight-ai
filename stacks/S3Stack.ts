import { StackContext, use, Queue, toCdkDuration } from "sst/constructs";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";
import { FileMetadataStack } from "./FileMetadataStack";

export function S3Stack({ stack }: StackContext) {
    // Reference the DynamoDB table from FileMetadataStack
    const { fileMetadataTable } = use(FileMetadataStack);

    // Create an S3 bucket with the desired removal policy and CORS configuration
    const bucket = new Bucket(stack, "ReportBucket", {
        versioned: true,
        removalPolicy: stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        publicReadAccess: true,  // Sets the bucket to be publicly accessible
        blockPublicAccess: BlockPublicAccess.BLOCK_ACLS, // Allows public access while blocking specific ACLs
        cors: [
            {
                allowedHeaders: ["*"],
                allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
                allowedOrigins: ["*"], // TODO: Replace "*" with your frontend's domain for production
                exposedHeaders: ["ETag"],
                maxAge: 3000,
            },
        ],
    });

    // Create an SQS queue with a consumer Lambda function
    const queue = new Queue(stack, "PDFSplitQueue", {
        cdk: {
            queue: {
                visibilityTimeout: toCdkDuration('300 seconds'), // Set visibility timeout to 5 minutes
            },
        },
    });
    
    // Add the consumer Lambda function to the queue
    queue.addConsumer(stack, {
        function: {
            handler: "packages/functions/src/lambda/splitPDF.handler",
            environment: {
                SQS_QUEUE_URL: queue.queueUrl,
                FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,  
            },
            permissions: [bucket, fileMetadataTable], 
        },
    });
    

    // Add outputs for the bucket and the queue
    stack.addOutputs({
        BucketName: bucket.bucketName,
        QueueURL: queue.queueUrl, // Output the queue URL
    });

    return { bucket, queue };
}
