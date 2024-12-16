import { S3Event, Context } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { processSchoolsReviews } from './CSV-Functions/processSchoolsReviews';

const dynamoDb = new AWS.DynamoDB.DocumentClient();


export async function handler(event: S3Event, context: Context): Promise<void> {
    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        console.log(`Bucket: ${bucketName}, File: ${objectKey}`);

        switch (objectKey) {
            case 'CSVFiles/Results of Government Schools Reviews.csv':
                await processSchoolsReviews(bucketName, objectKey, process.env.SCHOOL_REVIEWS_TABLE_NAME!, 'Government');
                break;
            case 'CSVFiles/Results of Private Schools Reviews.csv':
                await processSchoolsReviews(bucketName, objectKey, process.env.SCHOOL_REVIEWS_TABLE_NAME!, 'Private');
                break;
            case 'CSVFiles/Results of Higher Education Reviews.csv':
                await processHigherEducationReviews(bucketName, objectKey);
                break;
            case 'CSVFiles/Results of National Framework Operations.csv':
                await processNationalFrameworkOperations(bucketName, objectKey);
                break;
            case 'CSVFiles/Results of Vocational Reviews.csv':
                await processVocationalReviews(bucketName, objectKey);
                break;
            default:
                console.warn(`No processing function defined for file: ${objectKey}`);
        }
    }
}



async function emptyTable(tableName: string) {
    let lastEvaluatedKey: AWS.DynamoDB.DocumentClient.Key | undefined = undefined;
  
    do {
      const scanResult = await dynamoDb.scan({
        TableName: tableName,
        ProjectionExpression: "InstitutionCode" // Only retrieve the key
      }).promise();
  
      if (scanResult.Items && scanResult.Items.length > 0) {
        const deleteRequests = scanResult.Items.map(item => ({
          DeleteRequest: { Key: { InstitutionCode: item.InstitutionCode } }
        }));
  
        // Batch delete can handle up to 25 items per request
        await dynamoDb.batchWrite({ RequestItems: { [tableName]: deleteRequests } }).promise();
      }
  
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);
}

async function processHigherEducationReviews(bucket: string, key: string): Promise<void> {
    console.log(`Processing Higher Education Reviews from ${bucket}/${key}`);
    // Implement specific processing logic here
}

async function processNationalFrameworkOperations(bucket: string, key: string): Promise<void> {
    console.log(`Processing National Framework Operations from ${bucket}/${key}`);
    // Implement specific processing logic here
}

async function processPrivateSchoolsReviews(bucket: string, key: string): Promise<void> {
    console.log(`Processing Private Schools Reviews from ${bucket}/${key}`);
    // Implement specific processing logic here
}

async function processVocationalReviews(bucket: string, key: string): Promise<void> {
    console.log(`Processing Vocational Reviews from ${bucket}/${key}`);
    // Implement specific processing logic here
}
