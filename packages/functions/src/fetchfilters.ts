import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'; // Importing AWS Lambda event and result types for type safety
import AWS from 'aws-sdk'; // Importing AWS SDK to interact with DynamoDB

// Initialize DynamoDB DocumentClient which provides a higher-level API to interact with DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Main Lambda function handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Extract table names from environment variables, fallback to empty string if not set
  const tableName = process.env.TABLE_NAME || ''; 
  const uniTable = process.env.UNIVERSITY_TABLE_NAME || ''; 
  const progTable = process.env.PROGRAM_TABLE_NAME || ''; 
  const vocTable = process.env.VOCATIONAL_TABLE_NAME || ''; 
  
  // Check if all necessary environment variables are set, if not return a 500 error
  if (!tableName || !uniTable || !progTable || !vocTable) {
    return {
      statusCode: 500, 
      body: JSON.stringify({ error: 'Required environment variables are not set.' }),
    };
  }

  // Destructure query parameters passed to the Lambda function to filter the data
  const { 
    classification, 
    level, 
    location, 
    universityName, 
    programmeName,
    vocationalCenterName,
    vocationalCenterLocation 
  } = event.queryStringParameters || {}; // Use default empty object if queryStringParameters is undefined

  try {
    // Fetch data from multiple DynamoDB tables in parallel using Promise.all
    const [instituteFilters, universityFilters, vocationalFilters] = await Promise.all([
      fetchInstituteData(tableName, { classification, level, location }), // Fetch institute data with filters
      fetchUniversityData(uniTable, progTable, { universityName, programmeName }), // Fetch university data with program filters
      fetchVocationalData(vocTable, { vocationalCenterName, vocationalCenterLocation }) // Fetch vocational center data with filters
    ]);

    // Log fetched data for debugging purposes
    console.log('Institute Data:', instituteFilters);
    console.log('University Data:', universityFilters);
    console.log('Vocational Data:', vocationalFilters);

    // Return the fetched data as a successful response
    return {
      statusCode: 200,
      body: JSON.stringify({
        filters: instituteFilters, // Institute filters (classification, level, location)
        universityFilters, // University filters (name, program)
        vocationalFilters, // Vocational center filters (name, location)
      }),
    };
  } catch (error) {
    // Catch any errors during the data fetching and return an error message
    console.error('Error:', error);
    return {
      statusCode: 500, // Internal server error
      body: JSON.stringify({ error: 'Error fetching data from DynamoDB.' }),
    };
  }
};

// Function to fetch data from the main institute table with optional filters
const fetchInstituteData = async (
  tableName: string,
  filters: { classification?: string; level?: string; location?: string }
) => {
  const params = { TableName: tableName }; // Setup the DynamoDB scan parameters to scan the entire table

  try {
    // Scan DynamoDB table to fetch all data
    const data = await dynamoDB.scan(params).promise();
    console.log('Raw Institute Data:', data); // Log the raw data fetched from DynamoDB for debugging

    // Filter the results based on the provided filters (classification, level, location)
    let filteredData = data.Items || [];
    if (filters.classification) {
      filteredData = filteredData.filter(item => item.instituteClassification === filters.classification); // Filter by classification
    }
    if (filters.level) {
      filteredData = filteredData.filter(item => item.instituteGradeLevels === filters.level); // Filter by grade level
    }
    if (filters.location) {
      filteredData = filteredData.filter(item => item.instituteLocation === filters.location); // Filter by location
    }

    // Helper function to extract the year from a date string
    const extractYear = (date: string): string | null => date?.match(/(\d{4})/)?.[1] || null;

    // Return the unique values for classification, level, location, etc. by extracting them from the filtered data
    return {
      "Institute Classification": [...new Set(filteredData.map(item => item.instituteClassification))], // Unique classification
      "Institute Level": [...new Set(filteredData.map(item => item.instituteGradeLevels))], // Unique grade levels
      "Location": [...new Set(filteredData.map(item => item.instituteLocation))], // Unique locations
      "Institute Name": [...new Set(filteredData.map(item => item.institueName))], // Unique institute names
      "Report Year": [
        ...new Set(
          filteredData
            .map(item => extractYear(item.dateOfReview)) // Extract the year from the review date
            .filter(year => year !== null) // Filter out null values
        ),
      ],
    };
  } catch (error) {
    console.error('Error fetching institute data:', error); // Log the error if something goes wrong
    throw error; // Rethrow the error to be handled by the caller function
  }
};

// Function to fetch university and program data, with optional filters for university name and program name
const fetchUniversityData = async (
  uniTable: string,
  progTable: string,
  filters: { universityName?: string; programmeName?: string }
) => {
  // Set up the scan parameters for the university table
  const uniParams: AWS.DynamoDB.DocumentClient.ScanInput = { 
    TableName: uniTable
  };

  // If a university name filter is provided, add it to the scan parameters
  if (filters.universityName) {
    uniParams.FilterExpression = 'universityName = :universityName'; // Add the filter expression
    uniParams.ExpressionAttributeValues = { ':universityName': filters.universityName }; // Set the filter value
  }

  // Set up the scan parameters for the program table
  const progParams: AWS.DynamoDB.DocumentClient.ScanInput = { 
    TableName: progTable
  };

  // Add filters for university name and program name if they are provided
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

    // Combine all filter expressions with an AND condition
    progParams.FilterExpression = expressions.join(' AND '); 
    progParams.ExpressionAttributeValues = expressionValues; // Set the filter values
  }

  try {
    // Fetch data from both university and program tables in parallel using Promise.all
    const [uniData, progData] = await Promise.all([
      dynamoDB.scan(uniParams).promise(), // Fetch data from the university table
      dynamoDB.scan(progParams).promise() // Fetch data from the program table
    ]);

    const universities = uniData.Items || [];
    const programs = progData.Items || [];

    // Return the unique values for university name, program name, and program judgment
    return {
      "University Name": [...new Set(universities.map(item => item.universityName))], // Unique university names
      "Programme Name": [...new Set(programs.map(item => item.programmeName).filter(Boolean))], // Unique program names (filtering out falsy values)
      "Programme Judgment": [...new Set(programs.map(item => item.programmeJudgment).filter(Boolean))] // Unique program judgments (filtering out falsy values)
    };
  } catch (error) {
    console.error('Error fetching data:', error); // Log error if fetching data fails
    throw error; // Rethrow the error to be handled by the caller function
  }
};

// Function to fetch vocational center data with optional filters for name and location
const fetchVocationalData = async (
  vocTable: string,
  filters: { vocationalCenterName?: string; vocationalCenterLocation?: string }
) => {
  // Set up scan parameters for the vocational table
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: vocTable
  };

  console.log('Vocational Table Name:', vocTable); // Log the vocational table name for debugging
  console.log('Filters for Vocational Data:', filters); // Log the filters applied for debugging

  // If vocational center name or location filters are provided, add them to the scan parameters
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

    // Combine filter expressions and apply them to the scan parameters
    params.FilterExpression = expressions.join(' AND '); 
    params.ExpressionAttributeValues = expressionValues; 

    console.log('Filter Expression:', params.FilterExpression); // Log the final filter expression
    console.log('Expression Attribute Values:', params.ExpressionAttributeValues); // Log the final expression values
  }

  try {
    // Fetch vocational center data from DynamoDB
    const data = await dynamoDB.scan(params).promise();
    console.log('Raw Vocational Data:', data); // Log the raw data from DynamoDB

    const centers = data.Items || [];
    console.log('Filtered Vocational Centers:', centers); // Log the filtered vocational center data

    // Helper function to extract the year from date
    const extractYear = (date: string): string | null => date?.match(/(\d{4})/)?.[1] || null;

    // Return unique values for vocational center name, location, and report year
    return {
      "Vocational Center Name": [...new Set(centers.map(item => item.vocationalCenterName))], // Unique vocational center names
      "Center Location": [...new Set(centers.map(item => item.vocationalCenterLocation))], // Unique vocational center locations
      "Report Year": [
        ...new Set(
          centers
            .map(item => extractYear(item.dateOfReview)) // Extract the year from the review date
            .filter(year => year !== null) // Filter out null values
        ),
      ],
    };
  } catch (error) {
    console.error('Error fetching vocational center data:', error); // Log error if something goes wrong
    throw error; // Rethrow the error to be handled by the caller function
  }
};
