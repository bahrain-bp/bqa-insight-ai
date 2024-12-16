import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient();

export const handler = async () => {
  try {
    const tableName = process.env.SCHOOL_REVIEWS_TABLE_NAME;

    if (!tableName) {
      throw new Error("schools table name is not defined in environment variables");
    }

    // Scan the table for all attributes
    const command = new ScanCommand({
      TableName: tableName,
    });

    const response = await client.send(command);

    // Map DynamoDB's response to a more readable format
    const items = response.Items?.map((item: any) => ({
      InstitutionCode: item.InstitutionCode?.S,
      EnglishSchoolName: item.EnglishSchoolName?.S,
      ArabicSchoolName: item.ArabicSchoolName?.S,
      Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: items || [],
      }),
    };
  } catch (error) {
    console.error("Error retrieving government schools:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
    };
  }
};

// Helper function to parse the Reviews attribute, which is likely a List of Maps
function parseReviews(reviewsAttribute: any): any[] {
  // reviewsAttribute should be { L: [...] } if it's a list
  if (!reviewsAttribute.L) return [];

  return reviewsAttribute.L.map((reviewItem: any) => {
    // Each review item should be a Map of attributes
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
