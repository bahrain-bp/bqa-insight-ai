import { StackContext, Bucket, Function, use } from "sst/constructs";
import { FileMetadataStack } from "./FileMetadataStack";

export function FileStorageStack({ stack }: StackContext) {
  // Reference the DynamoDB table from FileMetadataStack
  const { fileMetadataTable } = use(FileMetadataStack);

  const insertMetadataFunction = new Function(stack, "InsertFileMetadataFunction", {
    handler: "packages/functions/src/insertFileMetadata.main",
    bind: [fileMetadataTable], 
  });

  const deleteMetadataFunction = new Function(stack, "DeleteFileMetadataFunction", {
    handler: "packages/functions/src/deleteFileMetadata.main",
    bind: [fileMetadataTable], 
  });

  // Set up the S3 bucket and add notifications for both insert and delete events
  const testBucket = new Bucket(stack, "TestBucket", {
    notifications: {
      uploadNotification: {
        function: insertMetadataFunction,
        events: ["object_created"], 
      },
      deleteNotification: {
        function: deleteMetadataFunction,
        events: ["object_removed"], 
      },
    },
  });

  // Output resources as needed
  stack.addOutputs({
    TestBucketName: testBucket.bucketName,
  });
}
