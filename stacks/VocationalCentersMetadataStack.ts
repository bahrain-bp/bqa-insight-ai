import { StackContext, Table } from "sst/constructs";
export function VocationalCentersMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const vocationalCenterMetadataTable = new Table(stack, "vocationalCenterMetadata", {
    fields: {
        vocationalCenterName: "string",
        vocationalCenterLocation: "string", 
        dateOfReview: "string",
    },
    primaryIndex: { partitionKey: "vocationalCenterName" },
  });

  // Output the table name for reference
  stack.addOutputs({
    VocationCenterMetadataTableName: vocationalCenterMetadataTable.tableName,
  });

  return { vocationalCenterMetadataTable };

}