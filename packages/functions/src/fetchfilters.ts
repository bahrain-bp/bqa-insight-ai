import AWS from "aws-sdk";

// Initialize DynamoDB Document Client
AWS.config.update({ region: "us-east-1" }); // Replace with your AWS region
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = "DummyDataTable"; // Replace with your table name

// Function to fetch available values for the filters dynamically
const getAvailableFilterOptions = async (filter: string, value: string) => {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_NAME,
  };

  // Adding dynamic filters
  params.FilterExpression = `#${filter} = :value`;
  params.ExpressionAttributeNames = { [`#${filter}`]: filter };
  params.ExpressionAttributeValues = { ":value": value };

  try {
    const result = await dynamoDB.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error("Error fetching filter options:", error);
    throw error;
  }
};

// Function to get the filtered data based on the dynamic filters
export const getFilteredData = async (filters: any) => {
  const { reportType, classification, finalJudgment, governorate, instituteName, programs, reviewCycle, sector } = filters;

  // Initialize the query parameters
  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#reportType = :reportType",
    ExpressionAttributeNames: {
      "#reportType": "reportType", // DynamoDB attribute for report type
    },
    ExpressionAttributeValues: {
      ":reportType": reportType, // Initialize ExpressionAttributeValues
    },
  };

  // Ensure ExpressionAttributeNames and ExpressionAttributeValues are always initialized
  params.ExpressionAttributeNames = params.ExpressionAttributeNames || {};
  params.ExpressionAttributeValues = params.ExpressionAttributeValues || {};
  
  params.ExpressionAttributeNames = params.ExpressionAttributeNames as AWS.DynamoDB.DocumentClient.ExpressionAttributeNameMap;
  params.ExpressionAttributeValues = params.ExpressionAttributeValues as AWS.DynamoDB.DocumentClient.ExpressionAttributeValueMap;

  // Add filters dynamically
  if (classification) {
    params.ExpressionAttributeNames["#classification"] = "classification";
    params.ExpressionAttributeValues[":classification"] = classification;
    params.FilterExpression = params.FilterExpression ? `${params.FilterExpression} AND #classification = :classification` : "#classification = :classification";
  }

  if (finalJudgment) {
    params.ExpressionAttributeNames["#finalJudgment"] = "finalJudgment";
    params.ExpressionAttributeValues[":finalJudgment"] = finalJudgment;
    params.FilterExpression = params.FilterExpression ? `${params.FilterExpression} AND #finalJudgment = :finalJudgment` : "#finalJudgment = :finalJudgment";
  }

  if (governorate) {
    params.ExpressionAttributeNames["#governorate"] = "governorate";
    params.ExpressionAttributeValues[":governorate"] = governorate;
    params.FilterExpression = params.FilterExpression ? `${params.FilterExpression} AND #governorate = :governorate` : "#governorate = :governorate";
  }

  if (instituteName) {
    params.ExpressionAttributeNames["#instituteName"] = "instituteName";
    params.ExpressionAttributeValues[":instituteName"] = instituteName;
    params.FilterExpression = params.FilterExpression ? `${params.FilterExpression} AND #instituteName = :instituteName` : "#instituteName = :instituteName";
  }

  if (programs && programs.length > 0) {
    params.ExpressionAttributeNames["#programs"] = "programs";
    params.ExpressionAttributeValues[":programs"] = programs;
    params.FilterExpression = params.FilterExpression ? `${params.FilterExpression} AND #programs = :programs` : "#programs = :programs";
  }

  if (reviewCycle) {
    params.ExpressionAttributeNames["#reviewCycle"] = "reviewCycle";
    params.ExpressionAttributeValues[":reviewCycle"] = reviewCycle;
    params.FilterExpression = params.FilterExpression ? `${params.FilterExpression} AND #reviewCycle = :reviewCycle` : "#reviewCycle = :reviewCycle";
  }

  if (sector) {
    params.ExpressionAttributeNames["#sector"] = "sector";
    params.ExpressionAttributeValues[":sector"] = sector;
    params.FilterExpression = params.FilterExpression ? `${params.FilterExpression} AND #sector = :sector` : "#sector = :sector";
  }

  // Query DynamoDB and return results
  try {
    const result = await dynamoDB.query(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error;
  }
};

// Lambda handler function to handle requests from API Gateway
export const handler = async (event: any) => {
  const { filter, value, filters } = JSON.parse(event.body);

  let response;

  if (filters) {
    // If the filters are provided, return filtered data
    const filteredData = await getFilteredData(filters);
    response = {
      statusCode: 200,
      body: JSON.stringify(filteredData),
    };
  } else {
    // Otherwise, return the available filter options
    const availableFilterOptions = await getAvailableFilterOptions(filter, value);
    response = {
      statusCode: 200,
      body: JSON.stringify(availableFilterOptions),
    };
  }

  return response;
};
