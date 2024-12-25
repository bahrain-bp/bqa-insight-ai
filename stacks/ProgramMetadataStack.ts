import { StackContext, Table } from "sst/constructs";
export function ProgramMetadataStack({ stack }: StackContext) {
  const programMetadataTable = new Table(stack, "ProgramMetadataStack", {
    fields: {
        fileKey: "string",
        universityName: "string",
        programmeName: "string",
        programmeJudgment: "string"
    },
    primaryIndex: { partitionKey: "universityName" , sortKey: "programmeName"},
  });

  stack.addOutputs({
    ProgramMetadataStack: programMetadataTable.tableName,
  });

  return { programMetadataTable };
}