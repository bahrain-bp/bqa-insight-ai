import { DynamoDB } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { Table } from "sst/node/table";

const dynamoDb = new DynamoDB.DocumentClient();

export async function main(event: S3Event) {
  try {
    for (const record of event.Records) {
      // Extract the object key from the S3 event
      const key = record.s3.object.key;
      const fileName = key.split('/').pop() || key; // Get the file name from the key

      // Define DynamoDB put parameters
      const putParams = {
        TableName: Table.FileMetadata.tableName, // Reference the DynamoDB table name
        Item: {
          fileName: fileName, // Storing the file name
          fileKey: key,       // Storing the full object key
        },
      };

      // Insert the file name and key into DynamoDB
      await dynamoDb.put(putParams).promise();
      console.log(`Inserted file name and key into DynamoDB: ${fileName}, ${key}`);
    }
  } catch (error) {
    console.error("Error inserting file name and key:", error);
  }
}
