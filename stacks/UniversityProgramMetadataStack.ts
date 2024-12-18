import { StackContext, Table } from "sst/constructs";
export function UniversityProgramMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const UniversityProgramMetadataStack = new Table(stack, "UniversityProgramMetadataStack", {
    fields: {
        universityName: "string",
        location: "string",
        numOfPrograms: "number",
        numOfQualifications: "number",
        universityClassification: "string",
    },
    primaryIndex: { partitionKey: "universityName" },
  });

  // Output the table name for reference
  stack.addOutputs({
    UniversityProgramMetadataStack: UniversityProgramMetadataStack.tableName,
  });

  return { UniversityProgramMetadataStack };

}