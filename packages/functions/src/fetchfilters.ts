import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.TABLE_NAME || ''; 
  const filemetadatatable = process.env.FILE_METADATA_TABLE_NAME;


  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'TABLE_NAME environment variable is not set' }),
    };
  }

  const { classification, level, location } = event.queryStringParameters || {}; // Getting filters from query parameters

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

    // Transform the filtered data to match the format needed for the frontend
    const filters = {
      "Institute Classification": Array.from(new Set(filteredData.map(item => item.instituteClassification))),
      "Institute Level": Array.from(new Set(filteredData.map(item => item.instituteGradeLevels))),
      "Location": Array.from(new Set(filteredData.map(item => item.instituteLocation))),
      "Institute Name": Array.from(new Set(filteredData.map(item => item.institueName))),
      "Report Year": ["2021", "2022", "2023", "2024"], // Static or dynamic years
    };

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
