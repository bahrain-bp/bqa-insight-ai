import { Bucket, StackContext } from "sst/constructs";
import {HttpMethods} from "aws-cdk-lib/aws-s3";

export function ComprehendS3Stack({ stack }: StackContext) {
    const bucket = new Bucket(stack, "ComprehendBucket", {
        blockPublicACLs: true,
        cors: [
            {
                allowedHeaders: ["*"],
                allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
                allowedOrigins: ["*"], // TODO: Replace "*" with your frontend's domain for production
                exposedHeaders: ["ETag"],
                maxAge: "3000 seconds",
            },
        ],
    });



    stack.addOutputs({
        BucketName: bucket.bucketName,
    });

    return { bucket };
}
