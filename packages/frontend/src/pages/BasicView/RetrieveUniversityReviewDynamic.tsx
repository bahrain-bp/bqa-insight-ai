import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

type Review = {
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
};

type University = {
  InstitutionCode: string;
  EnglishUniversityName: string;
  Reviews: Review[];
};

const client = new DynamoDBClient();

export const handler = async (event: any) => {
  try {
    const tableName = process.env.UNIVERSITY_REVIEWS_TABLE_NAME;
    if (!tableName) {
      throw new Error("University reviews table name is not defined in environment variables.");
    }

    const universityNameSlot = event?.universityNameSlot;
    const specificUniversitiesSlot = event?.specificUniversitiesSlot;

    const command = new ScanCommand({ TableName: tableName });
    const response = await client.send(command);

    const universities: University[] = response.Items?.map((item: any) => ({
      InstitutionCode: item.InstitutionCode?.S || "",
      EnglishUniversityName: item.Title?.S || "",
      Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
    })) || [];

    let result: any;

    if (universityNameSlot) {
      result = getSingleUniversityReviews(universities, universityNameSlot);
    } else if (specificUniversitiesSlot) {
      result = compareSpecificUniversities(universities, specificUniversitiesSlot.split(","));
    } else {
      throw new Error("Invalid input provided.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result,
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

function parseReviews(reviewsAttribute: any): Review[] {
  if (!reviewsAttribute.L) return [];

  return reviewsAttribute.L.map((reviewItem: any) => {
    const reviewMap = reviewItem.M || {};
    return {
      Program: reviewMap.Program?.S || "",
      UnifiedStudyField: reviewMap.UnifiedStudyField?.S || "",
      Cycle: reviewMap.Cycle?.S || "",
      Type: reviewMap.Type?.S || "",
      Judgement: reviewMap.Judgement?.S || "",
      ReportFile: reviewMap.ReportFile?.S || "",
    };
  });
}

function getSingleUniversityReviews(universities: University[], universityName: string) {
  const university = universities.find(
    (u) => u.EnglishUniversityName.toLowerCase() === universityName.toLowerCase()
  );
  if (!university) {
    return { message: `No university found with the name ${universityName}.` };
  }
  return {
    universityName: university.EnglishUniversityName,
    reviews: university.Reviews,
  };
}

function compareSpecificUniversities(universities: University[], universityNames: string[]) {
  const matchedUniversities = universities.filter((university) =>
    universityNames.some(
      (name) => university.EnglishUniversityName.toLowerCase() === name.trim().toLowerCase()
    )
  );

  if (matchedUniversities.length === 0) {
    return { message: "No matching universities found." };
  }

  const comparisonData = matchedUniversities.map((university) => ({
    universityName: university.EnglishUniversityName,
    reviews: university.Reviews,
  }));

  return comparisonData;
}
