import { DynamoDBClient, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

// Initialize the DynamoDB Client
const client = new DynamoDBClient({});

// Define interfaces to match the frontend
interface Review {
  Title: string;
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
}

interface UniversityData {
  InstitutionCode: string;
  InstitutionName: string;
  Reviews: Review[];
  AverageJudgement: number;
}

// Lambda Handler Function
export const handler: APIGatewayProxyHandler = async () => {
  try {
    const tableName = process.env.UNIVERSITY_REVIEWS_TABLE_NAME;

    if (!tableName) {
      throw new Error("University reviews table name is not defined in environment variables");
    }

    const scanParams: ScanCommandInput = {
      TableName: tableName,
    };

    console.log("Scan parameters:", JSON.stringify(scanParams, null, 2));

    const command = new ScanCommand(scanParams);
    const response = await client.send(command);

    console.log("Raw response from DynamoDB:", JSON.stringify(response, null, 2));

    // Transform the data to match frontend expectations
    const items: UniversityData[] = response.Items?.map((item) => {
      console.log("Processing item:", JSON.stringify(item, null, 2));
      
      const reviews = parseReviews(item.Reviews);
      console.log("Parsed reviews:", JSON.stringify(reviews, null, 2));
      
      // Calculate average judgement
      const averageJudgement = calculateAverageJudgement(reviews);
      
      return {
        InstitutionCode: item.InstitutionCode?.S || item.Institution?.S || "",
        InstitutionName: item.InstitutionName?.S || item.Institution?.S || "",
        Reviews: reviews,
        AverageJudgement: averageJudgement
      };
    }) || [];

    // Filter out items with empty institution names
    const validItems = items.filter(item => item.InstitutionName !== "");
    
    console.log("Final processed items:", JSON.stringify(validItems, null, 2));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: validItems,
      }),
    };
  } catch (error) {
    console.error("Error retrieving university reviews:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
    };
  }
};

function parseReviews(reviewsAttribute: any): Review[] {
  if (!reviewsAttribute?.L) {
    console.log("No reviews found in attribute:", reviewsAttribute);
    return [];
  }

  return reviewsAttribute.L.map((reviewItem: any) => {
    console.log("Processing review item:", JSON.stringify(reviewItem, null, 2));
    
    const reviewMap = reviewItem.M || {};
    const review: Review = {
      Title: reviewMap.Title?.S || "",
      Program: reviewMap.Program?.S || "",
      UnifiedStudyField: reviewMap.UnifiedStudyField?.S || "",
      Cycle: reviewMap.Cycle?.S || "",
      Type: reviewMap.Type?.S || "",
      Judgement: reviewMap.Judgement?.S || "",
      ReportFile: reviewMap.ReportFile?.S || "",
    };

    console.log("Parsed review:", JSON.stringify(review, null, 2));
    return review;
  });
}

function calculateAverageJudgement(reviews: Review[]): number {
  if (reviews.length === 0) return 0;

  const validJudgements = reviews
    .map(review => parseInt(review.Judgement))
    .filter(judgement => !isNaN(judgement));

  if (validJudgements.length === 0) return 0;

  const sum = validJudgements.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / validJudgements.length).toFixed(2));
}