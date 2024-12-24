import { StackContext, Table } from "sst/constructs";
export function UniversityProgramMetadataStack({ stack }: StackContext) {
  // Create DynamoDB table to store file metadata
  const UniversityProgramMetadataTable = new Table(stack, "UniversityProgramMetadataStackk", {
    fields: {
       fileKey: "string",
        universityName: "string",
        location: "string",
        numOfPrograms: "number",
        numOfQualifications: "number",
    },
    primaryIndex: { partitionKey: "universityName" },
  });

  // Output the table name for reference
  stack.addOutputs({
    UniversityProgramMetadataStack: UniversityProgramMetadataTable.tableName,
  });

  return { UniversityProgramMetadataTable };

}