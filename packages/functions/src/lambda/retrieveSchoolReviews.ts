// src/handlers/schoolReviewsHandler.ts

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

    // Map DynamoDB's response to a more readable format, including SchoolType and AverageGrade
    const items = response.Items?.map((item: any) => ({
      InstitutionCode: item.InstitutionCode?.S,
      EnglishSchoolName: item.EnglishSchoolName?.S,
      ArabicSchoolName: item.ArabicSchoolName?.S,
      SchoolType: item.SchoolType?.S, 
      Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
      AverageGrade: item.Reviews ? calculateAverageGrade(parseReviews(item.Reviews)) : null,
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
function parseReviews(reviewsAttribute: any): Review[] {
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

// Define the Review interface for type safety
interface Review {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string; 
}

// Function to calculate the average grade
function calculateAverageGrade(reviews: Review[]): number | null {
  // Filter reviews where ReviewType is "Review Report"
  const reviewReports = reviews.filter(review => review.ReviewType === "Review Report");

  if (reviewReports.length === 0) return null; // No relevant reviews to calculate

  // Extract numerical grades from the Grade string
  const grades: number[] = reviewReports.map(review => {
    const match = review.Grade.match(/^\((\d)\)/); // Regex to extract number in ()
    return match ? parseInt(match[1], 10) : null;
  }).filter((grade): grade is number => grade !== null); // Type guard to filter out nulls

  if (grades.length === 0) return null; // No valid grades found

  // Calculate the average
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  const average = sum / grades.length;

  return parseFloat(average.toFixed(2)); // Rounded to two decimal places
}
