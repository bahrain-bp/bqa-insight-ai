import { StackContext, Table } from "sst/constructs";

export function FileMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const fileMetadataTable = new Table(stack, "FileMetadata", {
    fields: {
        fileKey: "string",
        fileName: "string",
        fileURL: "string",
        fileSize: "number",
        fileType: "string", 
        uploadedAt: "string", 
    },
    primaryIndex: { partitionKey: "fileKey" },
  });

  // Output the table name for reference
  stack.addOutputs({
    FileMetadataTableName: fileMetadataTable.tableName,
  });

  return { fileMetadataTable };
}
