import { DynamoDBClient, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

// Initialize the DynamoDB Client
const client = new DynamoDBClient({});

// Define the Review interface
interface Review {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string;
}

// Define the UniversityReview interface
interface UniversityReview {
  InstitutionCode: string;
  EnglishInstituteName: string;
  ArabicInstituteName: string;
  Reviews: Review[];
  AverageGrade: number | null;
}

// Lambda Handler Function
export const handler: APIGatewayProxyHandler = async () => {
  try {
    const tableName = process.env.UNIVERSITY_REVIEWS_TABLE_NAME;

    if (!tableName) {
      throw new Error("University reviews table name is not defined in environment variables");
    }

    // Define the parameters for the Scan operation
    const scanParams: ScanCommandInput = {
      TableName: tableName,
    };

    // Execute the Scan command
    const command = new ScanCommand(scanParams);
    const response = await client.send(command);

    // Map the DynamoDB items to UniversityReview objects
    const items: UniversityReview[] | undefined = response.Items?.map((item: any) => ({
      InstitutionCode: item.InstitutionCode?.S || "",
      EnglishInstituteName: item.EnglishInstituteName?.S || "",
      ArabicInstituteName: item.ArabicInstituteName?.S || "",
      Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
      AverageGrade: item.AverageGrade ? parseFloat(item.AverageGrade.N) : null,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: items || [],
      }),
    };
  } catch (error) {
    console.error("Error retrieving university reviews:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
    };
  }
};

// Function to parse the Reviews attribute from DynamoDB
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
