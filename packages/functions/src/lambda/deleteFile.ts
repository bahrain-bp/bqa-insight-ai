import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3, DynamoDB } from "aws-sdk";

const s3 = new S3();
const dynamodb = new DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.BUCKET_NAME || "";
const TABLE_NAME = process.env.FILE_METADATA_TABLE_NAME || "";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Request body is missing" }),
      };
    }

    const { fileKeys } = JSON.parse(event.body); // Expecting an array of fileKeys

    if (!Array.isArray(fileKeys) || fileKeys.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "fileKeys must be a non-empty array" }),
      };
    }

    const deletePromises = fileKeys.map(async (fileKey) => {
      try {
        const uniqueKey = fileKey.replace(/^Files\//, ""); // Extract unique key
        const splitDirectory = `SplitFiles/${uniqueKey}`;

        // Delete the main file from S3
        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileKey }).promise();
        console.log(`Deleted file from S3: ${fileKey}`);

        // Delete all objects in the SplitFiles directory
        const listObjectsResponse = await s3
          .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: splitDirectory })
          .promise();

        if (listObjectsResponse.Contents && listObjectsResponse.Contents.length > 0) {
          await s3
            .deleteObjects({
              Bucket: BUCKET_NAME,
              Delete: {
                Objects: listObjectsResponse.Contents.map((object) => ({
                  Key: object.Key!,
                })),
              },
            })
            .promise();
          console.log(`Deleted directory from S3: ${splitDirectory}`);
        } else {
          console.log(`No files found in directory: ${splitDirectory}`);
        }

        // Delete the metadata from DynamoDB
        await dynamodb.delete({ TableName: TABLE_NAME, Key: { fileKey } }).promise();
        console.log(`Deleted metadata from DynamoDB: ${fileKey}`);
      } catch (err) {
        console.error(`Failed to delete fileKey: ${fileKey}`, err);
        throw err; // Ensure any failure is caught at the top level
      }
    });

    // Wait for all deletion promises to resolve
    await Promise.all(deletePromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Files deleted successfully" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Internal server error" }),
    };
  }
};
