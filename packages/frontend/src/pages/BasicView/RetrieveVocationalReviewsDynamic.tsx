import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

// Define the Review type
type Review = {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string;
};

// Define the VocationalInstitute type
type VocationalInstitute = {
  InstitutionCode: string;
  EnglishInstituteName: string;
  ArabicInstituteName: string;
  Reviews: Review[];
  AverageGrade: number | null;
};

// Initialize the DynamoDB client
const client = new DynamoDBClient();

export const handler = async (event: any) => {
  try {
    const tableName = process.env.VOCATIONAL_REVIEWS_TABLE_NAME;
    if (!tableName) {
      throw new Error("Vocational institutes table name is not defined in environment variables");
    }

    // Extract Lex slots from the event
    const lexSlots = event.lexSlots;
    const instituteValue = lexSlots?.instituteValueSlot;
    const specificInstitutes = lexSlots?.specificInstitutesSlot;

    // Fetch data from DynamoDB
    const command = new ScanCommand({ TableName: tableName });
    const response = await client.send(command);

    // Parse the response into the VocationalInstitute type
    const institutes: VocationalInstitute[] = response.Items?.map((item: any) => ({
      InstitutionCode: item.InstitutionCode?.S,
      EnglishInstituteName: item.EnglishInstituteName?.S,
      ArabicInstituteName: item.ArabicInstituteName?.S,
      Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
      AverageGrade: item.AverageGrade ? parseFloat(item.AverageGrade.N) : null,
    })) || [];

    let result: any;

    // Process based on Lex slots
    if (instituteValue) {
      result = getSingleInstituteReviews(institutes, instituteValue);
    } else if (specificInstitutes) {
      result = compareSpecificInstitutes(institutes, specificInstitutes);
    } else {
      throw new Error("Invalid slot values provided.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result,
      }),
    };
  } catch (error) {
    console.error("Error retrieving vocational institute reviews:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
    };
  }
};

// Helper function to parse reviews
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

// Fetch reviews for a single institute
function getSingleInstituteReviews(institutes: VocationalInstitute[], instituteName: string) {
  const institute = institutes.find(
    (i) =>
      i.EnglishInstituteName.toLowerCase() === instituteName.toLowerCase() ||
      i.ArabicInstituteName === instituteName
  );
  if (!institute) {
    return { message: `No institute found with the name ${instituteName}.` };
  }
  return {
    instituteName: institute.EnglishInstituteName,
    reviews: institute.Reviews,
  };
}

// Compare specific institutes
function compareSpecificInstitutes(institutes: VocationalInstitute[], specificInstituteNames: string[]) {
  const filteredInstitutes = institutes.filter((institute) =>
    specificInstituteNames.some(
      (name) =>
        institute.EnglishInstituteName.toLowerCase() === name.toLowerCase() ||
        institute.ArabicInstituteName === name
    )
  );

  if (filteredInstitutes.length === 0) {
    return { message: "No matching institutes found for the specified names." };
  }

  const newestReviews = filteredInstitutes.map((institute) => {
    const latestReview = institute.Reviews.sort((a, b) =>
      new Date(b.BatchReleaseDate).getTime() - new Date(a.BatchReleaseDate).getTime()
    )[0];
    return {
      instituteName: institute.EnglishInstituteName,
      latestReview,
    };
  });

  return newestReviews;
}
