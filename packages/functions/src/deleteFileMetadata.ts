import { DynamoDB } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { Table } from "sst/node/table";

const dynamoDb = new DynamoDB.DocumentClient();

export async function main(event: S3Event) {
  try {
    for (const record of event.Records) {
      const key = record.s3.object.key;

      // Define DynamoDB delete parameters
      const deleteParams = {
        TableName: Table.FileMetadata.tableName,
        Key: {
          fileKey: key, 
        },
      };

      // Delete the metadata from DynamoDB
      await dynamoDb.delete(deleteParams).promise();
      console.log(`Deleted metadata for file: ${key}`);
    }
  } catch (error) {
    console.error("Error deleting file metadata:", error);
  }
}
