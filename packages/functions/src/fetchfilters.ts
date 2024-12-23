import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const tableName = process.env.TABLE_NAME || ''; 
  const uniTable = process.env.UNIVERSITY_TABLE_NAME || '';
  const progTable = process.env.PROGRAM_TABLE_NAME || '';

  if (!tableName || !uniTable || !progTable) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'TABLE_NAME environment variable is not set' }),
    };
  }

  const { classification, level, location, universityName, programmeName } = event.queryStringParameters || {}; // Getting filters from query parameters

  const params = {
    TableName: tableName,
  };

  try {
    const data = await dynamoDB.scan(params).promise();
    console.log(data);

    // Filter the data based on user selections for institutes
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

    // Now filter and transform the university data
    let uniFilteredData: any[] = [];

    if (universityName || programmeName) {
      const uniParams: AWS.DynamoDB.DocumentClient.ScanInput = {
        TableName: uniTable,
      };

      // If universityName or programmeName is provided, filter based on those
      if (universityName) {
        uniParams.FilterExpression = 'universityName = :universityName';
        uniParams.ExpressionAttributeValues = {
          ':universityName': universityName,
        };
      }

      if (programmeName) {
        uniParams.FilterExpression = uniParams.FilterExpression 
          ? `${uniParams.FilterExpression} and programmeName = :programmeName`
          : 'programmeName = :programmeName';
        uniParams.ExpressionAttributeValues = {
          ...uniParams.ExpressionAttributeValues,
          ':programmeName': programmeName,
        };
      }

      // Scan DynamoDB for university data
      const uniData = await dynamoDB.scan(uniParams).promise();
      uniFilteredData = uniData.Items || [];
    }

    // Transform the filtered university data for frontend
    const universityFilters = {
      "University Name": Array.from(new Set(uniFilteredData.map(item => item.universityName))),
      "Programme Name": Array.from(new Set(uniFilteredData.map(item => item.programmeName))),
      "Programme Judgment": Array.from(new Set(uniFilteredData.map(item => item.programmeJudgment))),
    };

    console.log('University Filters:', universityFilters); // Debugging

    return {
      statusCode: 200,
      body: JSON.stringify({
        filters,            // Institute filters
        universityFilters,  // University filters
      }),
    };
  } catch (error) {
    console.error('Error fetching items:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching items from DynamoDB' }),
    };
  }
};
