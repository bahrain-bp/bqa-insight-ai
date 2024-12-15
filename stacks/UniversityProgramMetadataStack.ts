import { StackContext, Table } from "sst/constructs";
export function UniversityProgramMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const UniversityProgramMetadataStack = new Table(stack, "UniversityProgramMetadataStack", {
    fields: {
        institueName: "string",
        programName: "string",
        finalJudgment: "string",
    },
    primaryIndex: { partitionKey: "institueName" },
  });

  // Output the table name for reference
  stack.addOutputs({
    UniversityProgramMetadataStack: UniversityProgramMetadataStack.tableName,
  });

  return { UniversityProgramMetadataStack };

}