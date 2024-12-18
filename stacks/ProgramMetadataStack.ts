import { StackContext, Table } from "sst/constructs";
export function ProgramMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const ProgramMetadataStack = new Table(stack, "ProgramMetadataStack", {
    fields: {
        universityName: "string",
        programName: "string",
        programJudgment: "string"
      
    },
    primaryIndex: { partitionKey: "universityName" , sortKey: "programName"},
  });

  // Output the table name for reference
  stack.addOutputs({
    ProgramMetadataStack: ProgramMetadataStack.tableName,
  });

  return { ProgramMetadataStack };

}