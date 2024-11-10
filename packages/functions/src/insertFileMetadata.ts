import { DynamoDB } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { Table } from "sst/node/table";

const dynamoDb = new DynamoDB.DocumentClient();

export async function main(event: S3Event) {
  try {
    for (const record of event.Records) {
      console.log(record);

      // Extract S3 event metadata
      const key = record.s3.object.key;
      const bucketName = record.s3.bucket.name;
      const size = record.s3.object.size;
      const fileExtension = key.split('.').pop() || "";
      const uploadedAt = record.eventTime;
      const userIdentity = record.userIdentity?.principalId || "unknown"; 

      // Define DynamoDB put parameters
      const putParams = {
        TableName: Table.FileMetadata.tableName,
        Item: {
          fileKey: key,           
          bucketName: bucketName, 
          size: size,             
          fileExtension: fileExtension, 
          uploadedAt: uploadedAt, 
          userIdentity: userIdentity, 
        },
      };

      // Insert the metadata into DynamoDB
      await dynamoDb.put(putParams).promise();
      console.log(`Inserted metadata into DynamoDB for file: ${key}`);
    }
  } catch (error) {
    console.error("Error inserting metadata:", error);
  }
}
