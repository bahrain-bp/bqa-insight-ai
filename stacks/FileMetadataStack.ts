import { StackContext, Table } from "sst/constructs";

export function FileMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const fileMetadataTable = new Table(stack, "FileMetadata", {
    fields: {
      fileKey: "string",
      bucketName: "string",
      size: "number",
      fileExtension: "string", 
      uploadedAt: "string",
      userIdentity: "string",  
    },
    primaryIndex: { partitionKey: "fileKey" },
  });

  // Output the table name for reference
  stack.addOutputs({
    FileMetadataTableName: fileMetadataTable.tableName,
  });

  return { fileMetadataTable };
}
