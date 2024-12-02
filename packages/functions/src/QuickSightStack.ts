// AWS SDK clients and commands for QuickSight and S3 and CSV parsing and date manipulation libraries imports
import { 
  QuickSightClient, 
  CreateDataSetCommand, 
  CreateDashboardCommand, 
  GenerateEmbedUrlForAnonymousUserCommand, 
  DeleteDashboardCommand, 
  DeleteDataSetCommand,
  DataSetImportMode
} from "@aws-sdk/client-quicksight";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import csvParser from "csv-parser";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Initialize AWS clients for QuickSight and S3
const quickSightClient = new QuickSightClient({ region: "us-east-1" });
const s3Client = new S3Client({ region: "us-east-1" });

// Define the session lifetime for the generated dashboard
const SESSION_LIFETIME_MINUTES = 60; 

/**
 * Reads a CSV file from an S3 bucket and returns its contents as an array of rows
 * @param bucketName - Name of the S3 bucket
 * @param fileKey - Path to the CSV file in the bucket
 * @returns Promise resolving to an array of row objects
 */
const readCsvFromS3 = async (bucketName: string, fileKey: string): Promise<Record<string, string>[]> => {
  // Create a command to retrieve the object from S3
  const command = new GetObjectCommand({ Bucket: bucketName, Key: fileKey });
  
  // Send the command and get the response
  const response = await s3Client.send(command);
  
  // Convert the response body to a readable stream
  const stream = response.Body as NodeJS.ReadableStream;
  const rows: Record<string, string>[] = [];
  
  // Return a promise that resolves when the CSV is fully parsed
  return new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
};

// Extend dayjs to support custom date parsing formats
dayjs.extend(customParseFormat);

/**
 * Automatically detects the schema (data types) of columns in a CSV
 * @param csvData - Array of row objects from the CSV
 * @returns Object containing detected column schemas
 */
const detectSchema = (csvData: Record<string, string>[]) => {
  // Supported date formats for detection
  const dateFormats = [
    "M/D/YYYY", "YYYY", "MM/DD/YYYY", "M-D-YYYY", "MM-DD-YYYY", 
    "YYYY-MM-DD", "YYYY/MM/DD", "D/M/YYYY", "DD/MM/YYYY", 
    "D-M-YYYY", "DD-MM-YYYY"
  ];

  /**
   * Infer the data type of a single value
   * @param value - Value to type-check
   * @returns Inferred data type (STRING, INTEGER, or DATETIME)
   */
  const inferType = (value: string): string => {
    // Handle empty or null values
    if (value === null || value === undefined || value.trim() === "") {
      return "STRING";
    }

    // Check if value is a number
    if (!isNaN(Number(value))) {
      return "INTEGER";
    }

    // Check if value matches any known date format
    for (const format of dateFormats) {
      if (dayjs(value, format, true).isValid()) {
        return "DATETIME";
      }
    }

    // Default to STRING if no other type matches
    return "STRING";
  };

  // Analyze each column in the CSV
  const columns = Object.keys(csvData[0]).map((columnName) => {
    // Get sample values for the column
    const sampleValues = csvData.map((row) => row[columnName]);
    const inferredTypes = sampleValues.map(inferType);

    // Count occurrences of each type
    const typeCounts = inferredTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Choose the most frequent type with priority: STRING -> DATETIME -> INTEGER
    const chosenType = ["STRING", "DATETIME", "INTEGER"].find((type) => typeCounts[type] > 0) || "STRING";

    return {
      Name: columnName,
      Type: chosenType,
    };
  });

  return { columns };
};

/**
 * Create a QuickSight dataset from the S3 CSV file
 * @param awsAccountId - AWS Account ID
 * @param schema - Detected schema of the CSV
 * @param bucketName - S3 bucket name
 * @param fileKey - Path to the CSV file
 * @returns QuickSight dataset creation response
 */
const createDataset = async (
  awsAccountId: string,
  schema: { columns: { Name: string; Type: string }[] },
  bucketName: string,
  fileKey: string
) => {
  // Generate unique IDs for table and dataset
  const tableId = `dynamicTable-${Date.now()}`;
  const datasetId = `dataset-${Date.now()}`;
  
  // Prepare dataset creation parameters
  const params = {
    AwsAccountId: awsAccountId,
    DataSetId: datasetId,
    Name: "Dynamic Dataset",
    ImportMode: "SPICE"as DataSetImportMode, // Explicitly cast to the correct type (enum)
    PhysicalTableMap: {
      [tableId]: {
        S3Source: {
          // data source ARN
          DataSourceArn: `arn:aws:quicksight:us-east-1:588738578192:dataset/65b9bf31-b2fb-4f3b-8320-cbaca88a4769`,
          InputColumns: schema.columns,
          UploadSettings: {
            ContainsHeader: true,
            Format: "CSV",
            StartFromRow: 1,
          },
        },
      } as any,
    },
  };
  
  // Send create dataset command
  const command = new CreateDataSetCommand(params);
  return await quickSightClient.send(command);
};

/**
 * Create a QuickSight dashboard using a template and the new dataset
 * @param awsAccountId - AWS Account ID
 * @param datasetId - ID of the newly created dataset
 * @returns QuickSight dashboard creation response
 */
const createDashboard = async (awsAccountId: string, datasetId: string) => {
  // Generate a unique dashboard ID
  const dashboardId = `dashboard-${Date.now()}`;
  
  // Prepare dashboard creation parameters
  const params = {
    AwsAccountId: awsAccountId,
    DashboardId: dashboardId,
    Name: "Dynamic Dashboard",
    SourceEntity: {
      SourceTemplate: {
        // template ARN
        Arn: `arn:aws:quicksight:{AWS_REGION}:{awsAccountId}:template/my-template`,
        DataSetReferences: [{ DataSetArn: datasetId, DataSetPlaceholder: "placeholder" }],
      },
    },
    Permissions: [
      {
        // IAM role
        Principal: `arn:aws:iam::588738578192:role/QuickSightRole`,
        Actions: ["quicksight:DescribeDashboard"],
      },
    ],
  };
  
  // Send create dashboard command
  const command = new CreateDashboardCommand(params);
  return await quickSightClient.send(command);
};

/**
 * Generate an anonymous embed (public) URL for the dashboard
 * @param awsAccountId - AWS Account ID
 * @param dashboardId - ID of the created dashboard
 * @returns Embed URL generation response
 */
const generateAnonymousEmbedUrl = async (awsAccountId: string, dashboardId: string) => {
  // Prepare embed URL generation parameters
  const params = {
    AwsAccountId: awsAccountId,
    Namespace: "default",
    AuthorizedResourceArns: [`arn:aws:quicksight:us-east-1:588738578192:dashboard/${dashboardId}`],
    ExperienceConfiguration: { Dashboard: { InitialDashboardId: dashboardId } },
    SessionLifetimeInMinutes: SESSION_LIFETIME_MINUTES,
  };
  
  // Send generate embed URL command
  const command = new GenerateEmbedUrlForAnonymousUserCommand(params);
  return await quickSightClient.send(command);
};

/**
 * Clean up QuickSight resources after the session expires
 * @param awsAccountId - AWS Account ID
 * @param dashboardId - ID of the created dashboard
 * @param datasetId - ID of the created dataset
 */
const cleanupResources = async (awsAccountId: string, dashboardId: string, datasetId: string) => {
  // Delete the dashboard
  await quickSightClient.send(new DeleteDashboardCommand({ 
    AwsAccountId: awsAccountId, 
    DashboardId: dashboardId 
  }));
  
  // Delete the dataset
  await quickSightClient.send(new DeleteDataSetCommand({ 
    AwsAccountId: awsAccountId, 
    DataSetId: datasetId 
  }));
};

/**
 * Lambda handler function to process the request and generate a dynamic dashboard
 * @param event - Lambda event containing S3 bucket, file key, and AWS account ID
 * @returns Response with embed URL or error message
 */
const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse input parameters from the event body
    const { bucketName, fileKey, awsAccountId } = JSON.parse(event.body || "{}");

    // Validate required parameters
    if (!bucketName || !fileKey || !awsAccountId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "Missing required parameters" }) 
      };
    }

    // Read CSV from S3
    const csvData = await readCsvFromS3(bucketName, fileKey);
    
    // Detect schema of the CSV
    const schema = detectSchema(csvData);

    // Create QuickSight dataset
    const datasetResponse = await createDataset(awsAccountId, schema, bucketName, fileKey);
    const datasetId = datasetResponse.DataSetId;

    if (!datasetId) {
      throw new Error("Dataset creation failed: DataSetId is undefined.");
    }

    // Create QuickSight dashboard
    const dashboardResponse = await createDashboard(awsAccountId, datasetId);
    const dashboardId = dashboardResponse.DashboardId;

    if (!dashboardId) {
      throw new Error("Dashboard creation failed: DashboardId is undefined.");
    }

    // Generate anonymous embed URL
    const embedUrlResponse = await generateAnonymousEmbedUrl(awsAccountId, dashboardId);

    // Schedule cleanup of resources after session lifetime
    setTimeout(() => {
      cleanupResources(awsAccountId, dashboardId, datasetId);
    }, SESSION_LIFETIME_MINUTES * 60 * 1000);

    // Return successful response with embed URL and metadata
    return {
      statusCode: 200,
      body: JSON.stringify({
        embedUrl: embedUrlResponse.EmbedUrl,
        dashboardId,
        datasetId,
        expiresAt: new Date(Date.now() + SESSION_LIFETIME_MINUTES * 60 * 1000).toISOString(),
      }),
    };
  } catch (error) {
    // Handle and log any errors during processing
    console.error("Error processing request:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Failed to generate public dashboard URL" }) 
    };
  }
};

// Export the handler for use in AWS Lambda
export { handler };