import { StackContext, Api } from "sst/constructs";
import {BlockPublicAccess, Bucket, HttpMethods} from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

export function S3Stack({ stack }: StackContext) {
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

    // API to get pre-signed URL
    const api = new Api(stack, "UploadReportApi", {
        routes: {
            "POST /generate-upload-url": {
                function: {
                    handler: "src/lambda/generateUploadUrl.handler",
                    environment: {
                        BUCKET_NAME: bucket.bucketName,
                    },
                    permissions: [bucket],
                },
            },
        },
    });

    stack.addOutputs({
        S3Endpoint: api.url,
        BucketName: bucket.bucketName,
    });

    return { bucket, api };
}
