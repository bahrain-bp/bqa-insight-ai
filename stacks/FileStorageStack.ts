import { StackContext, Bucket, Function, use } from "sst/constructs";
import { FileMetadataStack } from "./FileMetadataStack"; // Import the stack where the DynamoDB table is defined

export function FileStorageStack({ stack }: StackContext) {
  // Reference the DynamoDB table from FileMetadataStack
  const { fileMetadataTable } = use(FileMetadataStack);

  // Define the Lambda function and bind the DynamoDB table
  const insertMetadataFunction = new Function(stack, "InsertFileMetadataFunction", {
    handler: "packages/functions/src/insertFileMetadata.main",
    bind: [fileMetadataTable], // Bind the table to the function
  });

  // Set up the S3 bucket and add notifications if needed (optional)
  const testBucket = new Bucket(stack, "TestBucket", {
    notifications: {
      myNotification: {
        function: insertMetadataFunction,
        events: ["object_created"],
      },
    },
  });

  // Output resources as needed
  stack.addOutputs({
    TestBucketName: testBucket.bucketName,
  });
}
