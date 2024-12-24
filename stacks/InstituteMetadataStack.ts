import { StackContext, Table } from "sst/constructs";
export function InstituteMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const instituteMetadata = new Table(stack, "InstituteMetadata", {
    fields: {
       fileKey: "string",
        institueName: "string",
        instituteType: "string",
        instituteClassification: "number",
        instituteGradeLevels: "string", 
        instituteLocation: "string", 
        dateOfReview: "string",
    },
    primaryIndex: { partitionKey: "institueName" },
  });

  // Output the table name for reference
  stack.addOutputs({
    InstituteMetadataTableName: instituteMetadata.tableName,
  });

  return { instituteMetadata };

}