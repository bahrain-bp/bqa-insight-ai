import { StackContext, Table } from "sst/constructs";

export function OpenDataStack({ stack }: StackContext) {
  // Existing GovernmentSchools and PrivateSchools tables
  const SchoolReviewsTable = new Table(stack, "SchoolReviews", {
    fields: {
      InstitutionCode: "string",
      EnglishSchoolName: "string",
      ArabicSchoolName: "string",
      SchoolType: "string",
    },
    primaryIndex: { partitionKey: "InstitutionCode" },
  });

  const higherEducationReviewsTable = new Table(stack, "HigherEducationReviews", {
    fields: {
      RecordId: "string",
    },
    primaryIndex: { partitionKey: "RecordId" },
  });

  // New NationalFrameworkOperations table
  const nationalFrameworkOperationsTable = new Table(stack, "NationalFrameworkOperations", {
    fields: {
      RecordId: "string",
    },
    primaryIndex: { partitionKey: "RecordId" },
  });

  // New VocationalReviews table
  const vocationalReviewsTable = new Table(stack, "VocationalReviews", {
    fields: {
      RecordId: "string",
    },
    primaryIndex: { partitionKey: "RecordId" },
  });


  // Output table names
  stack.addOutputs({
    SchoolReviewsTable: SchoolReviewsTable.tableName,
    HigherEducationReviewsTableName: higherEducationReviewsTable.tableName,
    NationalFrameworkOperationsTableName: nationalFrameworkOperationsTable.tableName,
    VocationalReviewsTableName: vocationalReviewsTable.tableName,
  });

  return {
    SchoolReviewsTable,
    higherEducationReviewsTable,
    nationalFrameworkOperationsTable,
    vocationalReviewsTable,
  };
}
