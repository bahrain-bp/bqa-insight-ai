import { StackContext, Bucket, Function, use } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib/core";
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

    // Define the Lambda function for processing PDF splitting
    const splitPDFHandler = new Function(stack, "SplitPDFHandler", {
        handler: "packages/functions/src/lambda/splitPDF.handler",
        environment: {
            FILE_METADATA_TABLE_NAME: fileMetadataTable.tableName,
        },
        permissions: [fileMetadataTable, bucket], 
    });
    
    bucket.addNotifications(stack, {
        objectCreatedInFiles: {
            function: splitPDFHandler,
            events: ["object_created"], // Trigger on object creation
            filters: [{ prefix: "Files/" }], // Only trigger for objects under the `Files/` directory
        },
    });


    // Add outputs for the bucket
    stack.addOutputs({
        BucketName: bucket.bucketName,
    });

    return { bucket };
}
