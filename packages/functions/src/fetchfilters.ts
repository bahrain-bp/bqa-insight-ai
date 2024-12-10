// fetchfilters.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.TABLE_NAME || ''; // Ensure this is the correct table name
  
  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'TABLE_NAME environment variable is not set' }),
    };
  }

  const params = {
    TableName: tableName,
  };

  try { 
    const data = await dynamoDB.scan(params).promise();
    console.log(data)
    // Transform the data to match the format needed for the frontend
    const filters = {
      "Institute Classification": Array.from(new Set(data.Items?.map(item => item.instituteClassification))),
      "Institute Level": Array.from(new Set(data.Items?.map(item => item.instituteGradeLevels))),
      "Location": Array.from(new Set(data.Items?.map(item => item.instituteLocation))),
      "Institute Name": Array.from(new Set(data.Items?.map(item => item.institueName))),
      "Report Year": ["2021", "2022", "2023", "2024"], // You can keep this static or fetch dynamically if needed
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
