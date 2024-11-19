import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { format } from "date-fns";
import { extension } from "mime-types"; 

const client = new DynamoDBClient();

export const handler = async () => {
  try {
    // Define the table name (replace with your table name or use an environment variable)
    const tableName = process.env.FILE_METADATA_TABLE_NAME;

    if (!tableName) {
      throw new Error("Table name is not defined in environment variables");
    }

    // Define a ProjectionExpression to include all fields
    const projectionExpression = "fileKey, fileName, fileURL, fileSize, fileType, uploadedAt";

    // Scan the table with the ProjectionExpression
    const command = new ScanCommand({
      TableName: tableName,
      ProjectionExpression: projectionExpression,
    });

    const response = await client.send(command);

    // Map and format the response
    const items = response.Items?.map((item: any) => ({
      fileKey: item.fileKey?.S, // Include fileKey
      fileName: item.fileName?.S,
      fileURL: item.fileURL?.S,
      fileSize: formatFileSize(Number(item.fileSize?.N)), // Format file size
      fileType: formatFileType(item.fileType?.S), // Format file type
      uploadedAt: formatTime(item.uploadedAt?.S), // Format time
    }));

    console.log("Items:", items);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: items || [],
      }),
    };
  } catch (error) {
    console.error("Error retrieving file metadata:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
    };
  }
};

// Function to format time using date-fns in "yyyy-MM-dd hh:mm a"
const formatTime = (date: string | undefined): string | null => {
  if (!date) return null;
  return format(new Date(date), "yyyy-MM-dd hh:mm a");
};

// Function to convert file size from bytes to kilobytes and round to the nearest integer
const formatFileSize = (bytes: number | undefined): string | null => {
  if (!bytes) return null;
  const kilobytes = Math.round(bytes / 1024); // Convert bytes to KB and round to nearest integer
  return `${kilobytes} KB`;
};



// Function to format file type using mime-types
const formatFileType = (mimeType: string | undefined): string | null => {
  if (!mimeType) return null;
  const fileExtension = extension(mimeType); // Get file extension from MIME type
  return fileExtension || mimeType; // Fallback to MIME type if no extension found
};
