import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3, DynamoDB } from "aws-sdk";
import { syncDeleteKnowlegeBase } from "src/bedrock/deleteSync";

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
        const txtFileKey = `TextFiles/${uniqueKey}.txt`; // Construct the corresponding .txt file key
    
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
    
        // Delete the corresponding .txt file
        const txtFileResponse = await s3
          .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: txtFileKey })
          .promise();
    
        if (
          txtFileResponse.Contents &&
          txtFileResponse.Contents.some((object) => object.Key === txtFileKey)
        ) {
          await s3
            .deleteObject({ Bucket: BUCKET_NAME, Key: txtFileKey })
            .promise();
          console.log(`Deleted txt file from S3: ${txtFileKey}`);
        } else {
          console.log(`No corresponding txt file found for key: ${txtFileKey}`);
        }
    
        // Delete the metadata from DynamoDB
        await dynamodb.delete({ TableName: TABLE_NAME, Key: { fileKey } }).promise();
        console.log(`Deleted metadata from DynamoDB: ${fileKey}`);
      } catch (err) {
        console.error(`Failed to delete fileKey: ${fileKey}`, err);
        throw err; // Ensure any failure is caught at the top level
      }
    
      const uri = `s3://${BUCKET_NAME}/${fileKey}`;
      await syncDeleteKnowlegeBase(process.env.KNOWLEDGE_BASE_ID || "", process.env.DATASOURCE_BASE_ID || "", uri);
      console.log("Successful sync deleting...");
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
