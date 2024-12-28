import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

type Review = {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string;
};

type School = {
  InstitutionCode: string;
  EnglishSchoolName: string;
  ArabicSchoolName: string;
  SchoolType: string;
  Reviews: Review[];
  AverageGrade: number | null;
  SchoolLevel: string;
  SchoolGender: string;
};

const client = new DynamoDBClient();

export const handler = async (event: any) => {
  try {
    const tableName = process.env.SCHOOL_REVIEWS_TABLE_NAME;
    if (!tableName) {
      throw new Error("schools table name is not defined in environment variables");
    }

    const lexSlots = event.lexSlots;
    const schoolValue = lexSlots?.schoolValueSlot;
    const specificSchools = lexSlots?.specificSchoolsSlot;
    const compareSchools = lexSlots?.compareSchoolsSlot;

    const command = new ScanCommand({ TableName: tableName });
    const response = await client.send(command);

    const schools: School[] = response.Items?.map((item: any) => ({
      InstitutionCode: item.InstitutionCode?.S,
      EnglishSchoolName: item.EnglishSchoolName?.S,
      ArabicSchoolName: item.ArabicSchoolName?.S,
      SchoolType: item.SchoolType?.S,
      Reviews: item.Reviews ? parseReviews(item.Reviews) : [],
      AverageGrade: item.AverageGrade ? parseFloat(item.AverageGrade.N) : null,
      SchoolLevel: item.SchoolLevel?.S,
      SchoolGender: item.SchoolGender?.S,
    })) || [];

    let result: any;

    if (schoolValue) {
      result = getSingleSchoolReviews(schools, schoolValue);
    } else if (specificSchools) {
      result = compareSpecificSchools(schools, specificSchools);
    } else if (compareSchools) {
      result = compareSchoolTypes(schools);
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
    console.error("Error retrieving school reviews:", error);
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
      Cycle: reviewMap.Cycle?.S || "",
      Batch: reviewMap.Batch?.S || "",
      BatchReleaseDate: reviewMap.BatchReleaseDate?.S || "",
      ReviewType: reviewMap.ReviewType?.S || "",
      Grade: reviewMap.Grade?.S || "",
    };
  });
}

function getSingleSchoolReviews(schools: School[], schoolName: string) {
  const school = schools.find(
    (s) =>
      s.EnglishSchoolName.toLowerCase() === schoolName.toLowerCase() ||
      s.ArabicSchoolName === schoolName
  );
  if (!school) {
    return { message: `No school found with the name ${schoolName}.` };
  }
  return {
    schoolName: school.EnglishSchoolName,
    reviews: school.Reviews,
  };
}

function compareSpecificSchools(schools: School[], specificSchoolNames: string[]) {
  const filteredSchools = schools.filter((school) =>
    specificSchoolNames.some(
      (name) =>
        school.EnglishSchoolName.toLowerCase() === name.toLowerCase() ||
        school.ArabicSchoolName === name
    )
  );

  if (filteredSchools.length === 0) {
    return { message: "No matching schools found for the specified names." };
  }

  const newestReviews = filteredSchools.map((school) => {
    const latestReview = school.Reviews.sort((a, b) =>
      new Date(b.BatchReleaseDate).getTime() - new Date(a.BatchReleaseDate).getTime()
    )[0];
    return {
      schoolName: school.EnglishSchoolName,
      latestReview,
    };
  });

  return newestReviews;
}

function compareSchoolTypes(schools: School[]) {
  // Filter schools by type
  const governmentSchools = schools.filter((s) => s.SchoolType === "Government");
  const privateSchools = schools.filter((s) => s.SchoolType === "Private");

  // Generate datasets for the latest reviews of each school
  const governmentChartData = generateLatestReviewsDatasets(governmentSchools);
  const privateChartData = generateLatestReviewsDatasets(privateSchools);

  return {
    governmentSchools: governmentChartData,
    privateSchools: privateChartData,
  };
}

// Helper function to generate datasets with the latest reviews for each school
function generateLatestReviewsDatasets(schools: School[]) {
  return schools.map((school) => {
    // Get the latest review based on BatchReleaseDate
    const latestReview = school.Reviews.sort((a, b) =>
      new Date(b.BatchReleaseDate).getTime() - new Date(a.BatchReleaseDate).getTime()
    )[0];

    // Ensure a dataset is created even if no reviews are present
    if (!latestReview) {
      return {
        label: school.EnglishSchoolName,
        data: [],
      };
    }

    // Construct the dataset for this school
    return {
      label: school.EnglishSchoolName, // School name as the label
      data: [
        {
          x: latestReview.Cycle, // Use review cycle as x-axis value
          y: parseFloat(latestReview.Grade), // Use grade as y-axis value
        },
      ],
    };
  });
}