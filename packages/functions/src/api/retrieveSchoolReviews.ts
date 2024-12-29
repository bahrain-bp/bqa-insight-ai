
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient();

export const handler = async () => {
  try {
    const tableName = process.env.SCHOOL_REVIEWS_TABLE_NAME;

    if (!tableName) {
      throw new Error("schools table name is not defined in environment variables");
    }

    const command = new ScanCommand({
      TableName: tableName,
    });

    const response = await client.send(command);

    const items = response.Items?.map((item: any) => ({
      InstitutionCode: item.InstitutionCode?.S,
      EnglishSchoolName: item.EnglishSchoolName?.S,
      ArabicSchoolName: item.ArabicSchoolName?.S,
      SchoolType: item.SchoolType?.S, 
      Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
      AverageGrade: item.AverageGrade ? parseFloat(item.AverageGrade.N) : null,
      SchoolLevel: item.SchoolLevel?.S,
      SchoolGender: item.SchoolGender?.S,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: items || [],
      }),
    };
  } catch (error) {
    console.error("Error retrieving schools:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
    };
  }
};

interface Review {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string; 
}

function parseReviews(reviewsAttribute: any): Review[] {
  if (!reviewsAttribute.L) return [];

  return reviewsAttribute.L.map((reviewItem: any) => {
    const reviewMap = reviewItem.M || {};
    return {
      Cycle: reviewMap.Cycle?.S || "",
      Batch: reviewMap.Batch?.S || "",
      BatchReleaseDate: reviewMap.BatchReleaseDate?.S || "",
      ReviewType: reviewMap.ReviewType?.S || "",
      Grade: reviewMap.Grade?.S || "",
    };
  });
}


