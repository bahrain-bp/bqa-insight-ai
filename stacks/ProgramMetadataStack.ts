import { StackContext, Table } from "sst/constructs";
export function ProgramMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const programMetadataTable = new Table(stack, "ProgramMetadataStack", {
    fields: {
        fileKey: "string",
        universityName: "string",
        programmeName: "string",
        programmeJudgment: "string"
      
    },
    primaryIndex: { partitionKey: "universityName" , sortKey: "programmeName"},
  });

  // Output the table name for reference
  stack.addOutputs({
    ProgramMetadataStack: programMetadataTable.tableName,
  });

  return { programMetadataTable };

}