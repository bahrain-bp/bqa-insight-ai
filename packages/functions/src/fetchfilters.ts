import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

// Fetch API URL from environment variables (backend)
const API_URL = process.env.API_URL; 
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Optionally log the event for debugging purposes
  console.log('Event:', event);

  if (!API_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API_URL environment variable is not set' }),
    };
  }

  // Fetch data from external API (frontend)
  const response = await fetch(`${API_URL}/fetchfilters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Get DynamoDB Table Name from Lambda environment variables (server-side)
  const tableName = process.env.TABLE_NAME || ''; // Your table name from Lambda environment
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
    return {
      statusCode: 200,
      body: JSON.stringify({ items: data.Items }),
    };
  } catch (error) {
    console.error('Error fetching items:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching items' }),
    };
  }
};
