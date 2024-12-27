import { DynamoDBClient, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

// Initialize the DynamoDB Client
const client = new DynamoDBClient({});

// Define the Review interface
interface Review {
  Title: string;
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
}

// Define the UniversityReview interface
interface UniversityReview {
  Institution: string;
  Reviews: Review[];
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

    console.log("Scan parameters:", scanParams);

    // Execute the Scan command
    const command = new ScanCommand(scanParams);
    const response = await client.send(command);

    console.log("Raw response from DynamoDB:", response);

    // Map the DynamoDB items to UniversityReview objects
    const items: UniversityReview[] | undefined = response.Items?.map((item: any) => {
      console.log("Raw item from DynamoDB:", item);
      return {
        Institution: item.Institution?.S || "",
        Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
      };
    });

    console.log("Mapped items:", items);

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

  console.log("Parsing reviews attribute:", reviewsAttribute);

  return reviewsAttribute.L.map((reviewItem: any) => {
    const reviewMap = reviewItem.M || {};
    const review = {
      Title: reviewMap.Title?.S || "",
      Program: reviewMap.Program?.S || "",
      UnifiedStudyField: reviewMap.UnifiedStudyField?.S || "",
      Cycle: reviewMap.Cycle?.S || "",
      Type: reviewMap.Type?.S || "",
      Judgement: reviewMap.Judgement?.S || "",
      ReportFile: reviewMap.ReportFile?.S || "",
    };

    console.log("Parsed review:", review);
    return review;
  });
}
