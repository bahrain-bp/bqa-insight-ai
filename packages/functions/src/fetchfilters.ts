import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { instituteType } = event.queryStringParameters || {};  // Get the type of institute from query parameters
  let tableName = process.env.TABLE_NAME || '';  // Default table name

  // Validate institute type and set the corresponding table
  if (instituteType) {
    switch (instituteType.toLowerCase()) {
      case 'university':
        tableName = process.env.UNIVERSITY_TABLE_NAME || '';  // Use the environment variable for universities
        break;
      case 'vocational':
        tableName = process.env.VOCATIONAL_TABLE_NAME || '';  // Use the environment variable for vocational institutes
        break;
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid institute type' }),
        };
    }
  }

  // Check if the table name is provided
  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Institute table name is not set' }),
    };
  }

  const { classification, level, location } = event.queryStringParameters || {};  // Getting filters from query parameters

  const params = {
    TableName: tableName,
  };

  try {
    const data = await dynamoDB.scan(params).promise();
    console.log(data);

    // Filter the data based on user selections
    let filteredData = data.Items || [];

    if (classification) {
      filteredData = filteredData.filter(item => item.instituteClassification === classification);
    }
    if (level) {
      filteredData = filteredData.filter(item => item.instituteGradeLevels === level);
    }
    if (location) {
      filteredData = filteredData.filter(item => item.instituteLocation === location);
    }

    // Extract the year from dateOfReview
    const extractYear = (date: string): string | null => {
      if (!date) return null;
      const match = date.match(/(\d{4})/);
      return match ? match[1] : null;
    };

    // Transform the filtered data to match the format needed for the frontend
    const filters = {
      "Institute Classification": Array.from(new Set(filteredData.map(item => item.instituteClassification))),
      "Institute Level": Array.from(new Set(filteredData.map(item => item.instituteGradeLevels))),
      "Location": Array.from(new Set(filteredData.map(item => item.instituteLocation))),
      "Institute Name": Array.from(new Set(filteredData.map(item => item.institueName))),
      "Report Year": Array.from(new Set(filteredData
        .map(item => extractYear(item.dateOfReview))  // Extract year from date
        .filter(year => year !== null) // Filter out invalid dates
      )),
    };

    console.log(filters); // Debugging

    return {
      statusCode: 200,
      body: JSON.stringify({ filters }),
    };
  } catch (error) {
    console.error('Error fetching items:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching items from DynamoDB' }),
    };
  }
};
