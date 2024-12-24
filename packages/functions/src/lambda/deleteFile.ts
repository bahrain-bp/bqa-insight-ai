import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3, DynamoDB } from "aws-sdk";
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { syncDeleteKnowlegeBase } from "src/bedrock/deleteSync";

const s3 = new S3();
const dynamodb = new DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.BUCKET_NAME || "";
const TABLE_NAME = process.env.FILE_METADATA_TABLE_NAME || "";
const INSTITUTE_METADATA_TABLE  = process.env.INSTITUTE_METADATA_TABLE || "";
const PROGRAM_METADATA_TABLE_NAME = process.env.PROGRAM_METADATA_TABLE_NAME || "";
const UNIVERSITY_METADATA_TABLE_NAME = process.env.UNIVERSITY_METADATA_TABLE_NAME || "";

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

        // Remove .pdf from the uniqueKey and create a new key for .metadata.json file
        const metadataFileKey = `TextFiles/${uniqueKey.replace('.pdf', '')}.metadata.json`; // Removes .pdf if present

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

        // Delete the corresponding metadata.json file (after removing .pdf if present)
        const metadataFileResponse = await s3
          .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: metadataFileKey })
          .promise();

        if (
          metadataFileResponse.Contents &&
          metadataFileResponse.Contents.some((object) => object.Key === metadataFileKey)
        ) {
          await s3
            .deleteObject({ Bucket: BUCKET_NAME, Key: metadataFileKey })
            .promise();
          console.log(`Deleted metadata.json file from S3: ${metadataFileKey}`);
        } else {
          console.log(`No corresponding metadata.json file found for key: ${metadataFileKey}`);
        }
//here
// i need a query to list all the records with the same insitutute name as the one being deleted from the table name
// if the count is only one then delete it from the institute table as well , if it more than one then keep it in the inistutue no need to delete from it
// Get the institute name for the current file
const fileMetadata = await dynamodb
  .get({
    TableName: TABLE_NAME,
    Key: { fileKey }
  })
  .promise();

if (fileMetadata.Item?.instituteName) {
  // Query for all records with the same institute name
  const instituteRecords = await dynamodb
    .scan({
      TableName: TABLE_NAME,
      FilterExpression: "instituteName = :instituteName",
      ExpressionAttributeValues: {
        ":instituteName": fileMetadata.Item.instituteName
      }
    })
    .promise();

  // Delete from file metadata table
  await dynamodb.delete({ TableName: TABLE_NAME, Key: { fileKey } }).promise();

  // If this is the only record for this institute, delete from institute table
  if (instituteRecords.Items?.length === 1) {
    await dynamodb
      .delete({
        TableName: INSTITUTE_METADATA_TABLE,
        Key: { institueName: fileMetadata.Item.instituteName }
      })
      .promise();
    console.log(`Deleted institute from metadata table: ${fileMetadata.Item.instituteName}`);
  } else {
    console.log(`Keeping institute record as ${instituteRecords.Items?.length} files remain`);
  }
}
   //  Check and Delete from Program Metadata Table   
   
  //  const programRecord = await dynamodb.get({ TableName: PROGRAM_METADATA_TABLE_NAME, Key: { fileKey } }).promise();
  //  console.log(programRecord,"This isss the errorrrrrr")
  //  if (programRecord.Item) {
  //    const universityName = programRecord.Item.universityName
  //    const programmeName = programRecord.Item.programmeName
  //    await dynamodb.delete({ TableName: PROGRAM_METADATA_TABLE_NAME, Key: { universityName, programmeName } }).promise();
  //    console.log(`Deleted from program metadata table: ${fileKey}`);
  //  }

  //  // Check and Delete from University Metadata Table 
  //  const universityRecord = await dynamodb.get({ TableName: UNIVERSITY_METADATA_TABLE_NAME, Key: { fileKey } }).promise();
  //  console.log(universityRecord ,"This isss the errorrrrrr")
   
  //  if (universityRecord.Item) {
  //    const key = universityRecord.Item.universityName
  //    await dynamodb.delete({ TableName: UNIVERSITY_METADATA_TABLE_NAME, Key: { universityName: key } }).promise();
  //    console.log(`Deleted from university metadata table: ${fileKey}`);
  //  }



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
