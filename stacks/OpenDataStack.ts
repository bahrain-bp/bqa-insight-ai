import { StackContext, Table } from "sst/constructs";

export function OpenDataStack({ stack }: StackContext) {
  // Existing GovernmentSchools and PrivateSchools tables
  const SchoolReviewsTable = new Table(stack, "SchoolReviews", {
    fields: {
      InstitutionCode: "string",
    },
    primaryIndex: { partitionKey: "InstitutionCode" },
  });

  const HigherEducationProgrammeReviewsTable = new Table(stack, "HigherEducationProgrammeReviews", {
    fields: {
      Index: "number",
    },
    primaryIndex: { partitionKey: "Index" },
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
    },
    primaryIndex: { partitionKey: "InstitutionCode" },
  });

  // New UniversityReviews table
  const UniversityReviewsTable = new Table(stack, "UniversityReviews", {
    fields: {
      InstitutionCode: "string",
    },
    primaryIndex: { partitionKey: "InstitutionCode" },
  });

  // Output table names
  stack.addOutputs({
    SchoolReviewsTable: SchoolReviewsTable.tableName,
    HigherEducationReviewsTableName: HigherEducationProgrammeReviewsTable.tableName,
    NationalFrameworkOperationsTableName: NationalFrameworkOperationsTable.tableName,
    VocationalReviewsTableName: VocationalReviewsTable.tableName,
    UniversityReviewsTableName: UniversityReviewsTable.tableName, // Add UniversityReviewsTable to outputs
  });

  return {
    SchoolReviewsTable,
    HigherEducationProgrammeReviewsTable,
    NationalFrameworkOperationsTable,
    VocationalReviewsTable,
    UniversityReviewsTable, // Return UniversityReviewsTable
  };
}
