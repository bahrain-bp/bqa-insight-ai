import { Bucket, StackContext } from "sst/constructs";

export function S3Stack({ stack }: StackContext) {
    // Create an S3 bucket
    const bucket = new Bucket(stack, "Report", {
        // Optionally configure bucket properties
        publicAccess: true, // This makes the bucket publicly accessible
        cdk: {
            bucket: {
                versioned: true, // Enables versioning
                removalPolicy: stack.stage === "prod" ? undefined : "DESTROY", // Retain the prod bucket
            },
        },
    });

    // Output bucket name for easy reference in other parts of your application
    stack.addOutputs({
        BucketName: bucket.bucketName,
    });

    return { bucket };
}
