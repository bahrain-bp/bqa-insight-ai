import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Environment variables
  const tableName = process.env.TABLE_NAME || '';
  const uniTable = process.env.UNIVERSITY_TABLE_NAME || '';
  const progTable = process.env.PROGRAM_TABLE_NAME || '';
  const vocTable = process.env.VOCATIONAL_TABLE_NAME || '';
  
  // Validate required environment variables
  if (!tableName || !uniTable || !progTable || !vocTable) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Required environment variables are not set.' }),
    };
  }

  // Extract query parameters
  const { 
    classification, 
    level, 
    location, 
    universityName, 
    programmeName,
    vocationalCenterName,
    vocationalCenterLocation 
  } = event.queryStringParameters || {};

  try {
    // Fetch and filter all data in parallel
    const [instituteFilters, universityFilters, vocationalFilters] = await Promise.all([
      fetchInstituteData(tableName, { classification, level, location }),
      fetchUniversityData(uniTable, progTable, { universityName, programmeName }),
      fetchVocationalData(vocTable, { vocationalCenterName, vocationalCenterLocation })
    ]);

    console.log('Institute Data:', instituteFilters);
    console.log('University Data:', universityFilters);
    console.log('Vocational Data:', vocationalFilters);

    return {
      statusCode: 200,
      body: JSON.stringify({
        filters: instituteFilters,
        universityFilters,
        vocationalFilters,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching data from DynamoDB.' }),
    };
  }
};

// Your existing fetchInstituteData function remains the same
const fetchInstituteData = async (
  tableName: string,
  filters: { classification?: string; level?: string; location?: string }
) => {
  const params = { TableName: tableName };

  try {
    const data = await dynamoDB.scan(params).promise();
    console.log('Raw Institute Data:', data);

    let filteredData = data.Items || [];

    if (filters.classification) {
      filteredData = filteredData.filter(item => item.instituteClassification === filters.classification);
    }
    if (filters.level) {
      filteredData = filteredData.filter(item => item.instituteGradeLevels === filters.level);
    }
    if (filters.location) {
      filteredData = filteredData.filter(item => item.instituteLocation === filters.location);
    }

    const extractYear = (date: string): string | null => date?.match(/(\d{4})/)?.[1] || null;

    return {
      "Institute Classification": [...new Set(filteredData.map(item => item.instituteClassification))],
      "Institute Level": [...new Set(filteredData.map(item => item.instituteGradeLevels))],
      "Location": [...new Set(filteredData.map(item => item.instituteLocation))],
      "Institute Name": [...new Set(filteredData.map(item => item.institueName))],
      "Report Year": [
        ...new Set(
          filteredData
            .map(item => extractYear(item.dateOfReview))
            .filter(year => year !== null)
        ),
      ],
    };
  } catch (error) {
    console.error('Error fetching institute data:', error);
    throw error;
  }
};

// Your existing fetchUniversityData function remains the same
const fetchUniversityData = async (
  uniTable: string,
  progTable: string,
  filters: { universityName?: string; programmeName?: string }
) => {
  const uniParams: AWS.DynamoDB.DocumentClient.ScanInput = { 
    TableName: uniTable
  };
  if (filters.universityName) {
    uniParams.FilterExpression = 'universityName = :universityName';
    uniParams.ExpressionAttributeValues = { ':universityName': filters.universityName };
  }

  const progParams: AWS.DynamoDB.DocumentClient.ScanInput = { 
    TableName: progTable
  };
  if (filters.universityName || filters.programmeName) {
    const expressions: string[] = [];
    const expressionValues: Record<string, string> = {};
    
    if (filters.universityName) {
      expressions.push('universityName = :universityName');
      expressionValues[':universityName'] = filters.universityName;
    }
    if (filters.programmeName) {
      expressions.push('programmeName = :programmeName');
      expressionValues[':programmeName'] = filters.programmeName;
    }
    
    progParams.FilterExpression = expressions.join(' AND ');
    progParams.ExpressionAttributeValues = expressionValues;
  }

  try {
    const [uniData, progData] = await Promise.all([
      dynamoDB.scan(uniParams).promise(),
      dynamoDB.scan(progParams).promise()
    ]);

    const universities = uniData.Items || [];
    const programs = progData.Items || [];

    return {
      "University Name": [...new Set(universities.map(item => item.universityName))],
      "Programme Name": [...new Set(programs.map(item => item.programmeName).filter(Boolean))],
      "Programme Judgment": [...new Set(programs.map(item => item.programmeJudgment).filter(Boolean))]
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// New function to fetch vocational center data
const fetchVocationalData = async (
  vocTable: string,
  filters: { vocationalCenterName?: string; vocationalCenterLocation?: string }
) => {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: vocTable
  };

  console.log('Vocational Table Name:', vocTable);
  console.log('Filters for Vocational Data:', filters);

  // Add filters if provided
  if (filters.vocationalCenterName || filters.vocationalCenterLocation) {
    const expressions: string[] = [];
    const expressionValues: Record<string, string> = {};

    if (filters.vocationalCenterName) {
      expressions.push('vocationalCenterName = :vocationalCenterName');
      expressionValues[':vocationalCenterName'] = filters.vocationalCenterName;
    }
    if (filters.vocationalCenterLocation) {
      expressions.push('vocationalCenterLocation = :vocationalCenterLocation');
      expressionValues[':vocationalCenterLocation'] = filters.vocationalCenterLocation;
    }

    params.FilterExpression = expressions.join(' AND ');
    params.ExpressionAttributeValues = expressionValues;

    console.log('Filter Expression:', params.FilterExpression);
    console.log('Expression Attribute Values:', params.ExpressionAttributeValues);
  }

  try {
    const data = await dynamoDB.scan(params).promise();
    console.log('Raw Vocational Data:', data);

    const centers = data.Items || [];

    console.log('Filtered Vocational Centers:', centers);

    const extractYear = (date: string): string | null => date?.match(/(\d{4})/)?.[1] || null;

    return {
      "Vocational Center Name": [...new Set(centers.map(item => item.vocationalCenterName))],
      "Center Location": [...new Set(centers.map(item => item.vocationalCenterLocation))],
      "Report Year": [
        ...new Set(
          centers
            .map(item => extractYear(item.dateOfReview))
            .filter(year => year !== null)
        ),
      ],
    };
  } catch (error) {
    console.error('Error fetching vocational center data:', error);
    throw error;
  }
};

