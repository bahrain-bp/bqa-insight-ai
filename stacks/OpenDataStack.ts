import { StackContext, Table } from "sst/constructs";

export function OpenDataStack({ stack }: StackContext) {
  // Existing GovernmentSchools and PrivateSchools tables
  const SchoolReviewsTable = new Table(stack, "SchoolReviews", {
    fields: {
      InstitutionCode: "string",
    },
    primaryIndex: { partitionKey: "InstitutionCode" },
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
    VocationalReviewsTableName: VocationalReviewsTable.tableName,
    UniversityReviewsTableName: UniversityReviewsTable.tableName, 
  });

  return {
    SchoolReviewsTable,
    VocationalReviewsTable,
    UniversityReviewsTable, 
  };
}
