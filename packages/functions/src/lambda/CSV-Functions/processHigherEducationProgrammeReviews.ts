import * as AWS from 'aws-sdk';
import csv from 'csv-parser';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

export async function processHigherEducationProgrammeReviews(bucket: string, key: string, tableName: string): Promise<void> {
  console.log(`Processing Higher Education Programme Reviews from ${bucket}/${key}`);

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const s3Stream = s3.getObject(params).createReadStream();
  let itemCount = 0;
  let indexCounter = 0;

  return new Promise((resolve, reject) => {
    s3Stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data: any) => {
        const institutionEnglishName = data['Institution Name E']?.trim();
        const institutionArabicName = data['Institution Name A']?.trim();
        const programmeName = data['Programme Name']?.trim() || '';
        const cycle = data['Cycle']?.trim() || '';
        const batch = data['Batch']?.trim() || '';
        const releaseDate = data['Release Date']?.trim() || '';
        const reviewType = data['Review Type']?.trim() || '';
        const generalConfidenceLevel = data['General Confidence level']?.trim() || '';

        if (!institutionEnglishName || !programmeName) {
          return;
        }

        const item = {
          Index: indexCounter++,
          InstitutionEnglishName: institutionEnglishName,
          InstitutionArabicName: institutionArabicName || '',
          ProgrammeName: programmeName,
          Cycle: cycle,
          Batch: batch,
          ReleaseDate: releaseDate,
          ReviewType: reviewType,
          GeneralConfidenceLevel: generalConfidenceLevel,
        };

        const putParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
          TableName: tableName,
          Item: item,
        };

        dynamoDb.put(putParams, (err) => {
          if (err) {
            console.error(`Error inserting item into ${tableName}:`, err);
          } else {
            itemCount++;
          }
        });
      })
      .on('end', () => {
        console.log(`CSV processing completed. Total items inserted: ${itemCount}`);
        resolve();
      })
      .on('error', (err: any) => {
        console.error("Error reading CSV from S3:", err);
        reject(err);
      });
  });
}
