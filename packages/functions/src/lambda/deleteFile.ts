import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3, DynamoDB } from "aws-sdk";
import { syncDeleteKnowlegeBase } from "src/bedrock/deleteSync";

const s3 = new S3();
const dynamodb = new DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.BUCKET_NAME || "";
const TABLE_NAME = process.env.FILE_METADATA_TABLE_NAME || "";
const INSTITUTE_METADATA_TABLE  = process.env.INSTITUTE_METADATA_TABLE || "";
const PROGRAM_METADATA_TABLE_NAME = process.env.PROGRAM_METADATA_TABLE_NAME || "";
const UNIVERSITY_METADATA_TABLE_NAME = process.env.UNIVERSITY_METADATA_TABLE_NAME || "";
const VOCATIONAL_CENTER_METADATA_TABLE_NAME = process.env.VOCATIONAL_CENTER_METADATA_TABLE_NAME || "";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Request body is missing" }),
      };
    }

    const { fileKeys } = JSON.parse(event.body);

    if (!Array.isArray(fileKeys) || fileKeys.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "fileKeys must be a non-empty array" }),
      };
    }

    const deletePromises = fileKeys.map(async (fileKey) => {
      try {
        const uniqueKey = fileKey.replace(/^Files\//, "");
        const splitDirectory = `SplitFiles/${uniqueKey}`;
        const txtFileKey = `TextFiles/${uniqueKey}.txt`;
        const metadataFileKey = `TextFiles/${uniqueKey.replace('.pdf', '')}.metadata.json`;

        // Delete the file from S3
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

        // Delete the corresponding metadata.json file
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

        // Get file metadata to access all necessary information
        const fileMetadata = await dynamodb
          .get({
            TableName: TABLE_NAME,
            Key: { fileKey }
          })
          .promise();

        // Handle institute deletion
        if (fileMetadata.Item?.instituteName) {
          const instituteRecords = await dynamodb
            .scan({
              TableName: TABLE_NAME,
              FilterExpression: "instituteName = :instituteName",
              ExpressionAttributeValues: {
                ":instituteName": fileMetadata.Item.instituteName
              }
            })
            .promise();

          await dynamodb.delete({ TableName: TABLE_NAME, Key: { fileKey } }).promise();
          console.log(`Deleted from file metadata table: ${fileKey}`);

          // check if the institute has more than 1 record only delete it from the file metadata and keep the institute
          if (instituteRecords.Items && instituteRecords.Items.length <= 1) {
            await dynamodb
              .delete({
                TableName: INSTITUTE_METADATA_TABLE,
                Key: { institueName: fileMetadata.Item.instituteName }
              })
              .promise();
            console.log(`Deleted institute from metadata table: ${fileMetadata.Item.instituteName}`);
          } else {
            const remainingFiles = instituteRecords.Items ? instituteRecords.Items.length - 1 : 0;
            console.log(`Keeping institute record as ${remainingFiles} files remain`);
          }
        }

        // Handle university deletion
        if (fileMetadata.Item?.universityName) {
          const universityRecords = await dynamodb
            .scan({
              TableName: TABLE_NAME,
              FilterExpression: "universityName = :universityName",
              ExpressionAttributeValues: {
                ":universityName": fileMetadata.Item.universityName
              }
            })
            .promise();

          // Handle program deletion by using the universityname as a link to get the program
          const programRecords = await dynamodb
            .scan({
              TableName: PROGRAM_METADATA_TABLE_NAME,
              FilterExpression: "universityName = :universityName",
              ExpressionAttributeValues: {
                ":universityName": fileMetadata.Item.universityName
              }
            })
            .promise();
          
            // check if the program has a record in the dynamo if yes then delete it
          if (programRecords.Items && programRecords.Items.length > 0) {
            for (const program of programRecords.Items) {
              await dynamodb.delete({ 
                TableName: PROGRAM_METADATA_TABLE_NAME, 
                Key: { 
                  universityName: program.universityName,
                  programmeName: program.programmeName 
                } 
              }).promise();
              console.log(`Deleted program from metadata table: ${program.programmeName}`);
            }
          }

          // if the university has more than 1 report keep it in the university table and only delete it from the file metadata table
          if (universityRecords.Items && universityRecords.Items.length <= 1) {
            await dynamodb.delete({ 
              TableName: UNIVERSITY_METADATA_TABLE_NAME, 
              Key: { 
                universityName: fileMetadata.Item.universityName
              } 
            }).promise();
            console.log(`Deleted university from metadata table: ${fileMetadata.Item.universityName}`);
          } else {
            const remainingFiles = universityRecords.Items ? universityRecords.Items.length - 1 : 0;
            console.log(`Keeping university record as ${remainingFiles} files remain`);
          }
        }

        // Handle vocational center deletion
        if (fileMetadata.Item?.vocationalCenterName) {
          const vocationalRecords = await dynamodb
            .scan({
              TableName: TABLE_NAME,
              FilterExpression: "vocationalCenterName = :vocationalCenterName",
              ExpressionAttributeValues: {
                ":vocationalCenterName": fileMetadata.Item.vocationalCenterName
              }
            })
            .promise();

          // Only delete from vocational center metadata if this is the last file
          if (vocationalRecords.Items && vocationalRecords.Items.length <= 1) {
            await dynamodb.delete({ 
              TableName: VOCATIONAL_CENTER_METADATA_TABLE_NAME, 
              Key: { 
                vocationalCenterName: fileMetadata.Item.vocationalCenterName
              } 
            }).promise();
            console.log(`Deleted vocational center from metadata table: ${fileMetadata.Item.vocationalCenterName}`);
          } else {
            const remainingFiles = vocationalRecords.Items ? vocationalRecords.Items.length - 1 : 0;
            console.log(`Keeping vocational center record as ${remainingFiles} files remain`);
          }
        }
        // Check if the instituteName is missing in the metadata, and if so, delete the item from the table
        if (!fileMetadata.Item?.instituteName) {
          await dynamodb.delete({ TableName: TABLE_NAME, Key: { fileKey } }).promise();
          console.log(`Deleted from file metadata table: ${fileKey}`);
        }

        // Delete from knowledge base
        const uri = `s3://${BUCKET_NAME}/${fileKey}`;
        await syncDeleteKnowlegeBase(process.env.KNOWLEDGE_BASE_ID || "", process.env.DATASOURCE_BASE_ID || "", uri);
        console.log("Successfully deleted from knowledge base");

      } catch (err) {
        console.error(`Failed to delete fileKey: ${fileKey}`, err);
        throw err;
      }
    });

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