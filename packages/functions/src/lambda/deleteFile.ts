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

    const { fileKey } = JSON.parse(event.body);

    if (!fileKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "fileKey is required" }),
      };
    }

    const uniqueKey = fileKey.replace(/^Files\//, "");
    const splitDirectory = `SplitFiles/${uniqueKey}`;

    // Delete from S3
    await s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileKey }).promise();
    const listObjectsResponse = await s3.listObjectsV2({ Bucket: BUCKET_NAME, Prefix: splitDirectory }).promise();

    if (listObjectsResponse.Contents && listObjectsResponse.Contents.length > 0) {
      await s3.deleteObjects({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: listObjectsResponse.Contents.map((object) => ({ Key: object.Key! })),
        },
      }).promise();
    }

    // Delete from DynamoDB
    await dynamodb.delete({ TableName: TABLE_NAME, Key: { fileKey } }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "File deleted successfully" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Internal server error" }),
    };
  }
};
