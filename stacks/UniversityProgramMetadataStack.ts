import { StackContext, Table } from "sst/constructs";
export function UniversityProgramMetadataStack({ stack }: StackContext) {
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

  stack.addOutputs({
    UniversityProgramMetadataStack: UniversityProgramMetadataTable.tableName,
  });

  return { UniversityProgramMetadataTable };
}