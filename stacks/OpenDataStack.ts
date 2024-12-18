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

  const HigherEducationReviewsTable = new Table(stack, "HigherEducationReviews", {
    fields: {
      RecordId: "string",
    },
    primaryIndex: { partitionKey: "RecordId" },
  });

  // New NationalFrameworkOperations table
  const NationalFrameworkOperationsTable = new Table(stack, "NationalFrameworkOperations", {
    fields: {
      RecordId: "string",
    },
    primaryIndex: { partitionKey: "RecordId" },
  });

  // New VocationalReviews table
  const VocationalReviewsTable = new Table(stack, "VocationalReviews", {
    fields: {
      InstitutionCode: "string",
      EnglishInstituteName: "string",
      ArabicInstituteName: "string",
      SchoolType: "string",
    },
    primaryIndex: { partitionKey: "InstitutionCode" },
  });


  // Output table names
  stack.addOutputs({
    SchoolReviewsTable: SchoolReviewsTable.tableName,
    HigherEducationReviewsTableName: HigherEducationReviewsTable.tableName,
    NationalFrameworkOperationsTableName: NationalFrameworkOperationsTable.tableName,
    VocationalReviewsTableName: VocationalReviewsTable.tableName,
  });

  return {
    SchoolReviewsTable,
    HigherEducationReviewsTable,
    NationalFrameworkOperationsTable,
    VocationalReviewsTable,
  };
}
