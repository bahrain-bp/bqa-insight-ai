import { S3Event, Context } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import csv from 'csv-parser';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.GOVERNMENT_SCHOOLS_TABLE_NAME!;

interface Review {
    Cycle: string;
    Batch: string;
    BatchReleaseDate: string;
    ReviewType: string;
    Grade: string;
  }
  
  interface SchoolData {
    InstitutionCode: string;
    ArabicSchoolName: string;
    EnglishSchoolName: string;
    Reviews: Review[];
  }


export async function handler(event: S3Event, context: Context): Promise<void> {
    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        console.log(`Bucket: ${bucketName}, File: ${objectKey}`);

        switch (objectKey) {
            case 'CSVFiles/Results of Government Schools Reviews.csv':
                emptyTable(tableName);
                await processGovernmentSchoolsReviews(bucketName, objectKey);
                break;
            case 'CSVFiles/Results of Higher Education Reviews.csv':
                await processHigherEducationReviews(bucketName, objectKey);
                break;
            case 'CSVFiles/Results of National Framework Operations.csv':
                await processNationalFrameworkOperations(bucketName, objectKey);
                break;
            case 'CSVFiles/Results of Private Schools Reviews.csv':
                await processPrivateSchoolsReviews(bucketName, objectKey);
                break;
            case 'CSVFiles/Results of Vocational Reviews.csv':
                await processVocationalReviews(bucketName, objectKey);
                break;
            default:
                console.warn(`No processing function defined for file: ${objectKey}`);
        }
    }
}

export async function processGovernmentSchoolsReviews(bucket: string, key: string): Promise<void> {
    console.log(`Processing Government Schools Reviews from ${bucket}/${key}`);
  
    const s3 = new AWS.S3();
    const params = {
      Bucket: bucket,
      Key: key,
    };
  
    const s3Stream = s3.getObject(params).createReadStream();
  
    // We'll store the schools data in a map keyed by InstitutionCode
    const schoolsMap: Record<string, SchoolData> = {};
  
    return new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on('data', (data: any) => {
            const institutionCode = data['Institution Code']?.trim(); // Trim spaces just in case
            
            // Skip rows with no institution code
            if (!institutionCode) {
                console.warn("Skipping row with no Institution Code:", data);
                return;
            }
            
            const arabicSchoolName = data['School Name A'] || "";
            const englishSchoolName = data['School Name E'] || "";
            
            const review: Review = {
                Cycle: data['Cycle'] || "",
                Batch: data['Batch'] || "",
                BatchReleaseDate: data['Batch Release Date'] || "",
                ReviewType: data['Review Type'] || "",
                Grade: data['Grade'] || "",
            };
            
            if (!schoolsMap[institutionCode]) {
                schoolsMap[institutionCode] = {
                InstitutionCode: institutionCode,
                ArabicSchoolName: arabicSchoolName,
                EnglishSchoolName: englishSchoolName,
                Reviews: [],
                };
            }
            
            schoolsMap[institutionCode].Reviews.push(review);
        })          
        .on('end', async () => {
          // Once the stream ends, insert all schools into DynamoDB
          const schools = Object.values(schoolsMap);
  
          // Batch write if there are many schools, otherwise just loop
          // DynamoDB batch write limit: 25 items per request
          // We'll chunk the requests if needed
          const chunkSize = 25;
          for (let i = 0; i < schools.length; i += chunkSize) {
            const chunk = schools.slice(i, i + chunkSize);
            const writeParams = {
              RequestItems: {
                [tableName]: chunk.map((school) => ({
                  PutRequest: {
                    Item: {
                      InstitutionCode: school.InstitutionCode,
                      EnglishSchoolName: school.EnglishSchoolName,
                      ArabicSchoolName: school.ArabicSchoolName,
                      Reviews: school.Reviews,
                    },
                  },
                })),
              },
            };
  
            try {
              await dynamoDb.batchWrite(writeParams).promise();
              console.log(`Inserted ${chunk.length} schools into ${tableName}`);
            } catch (error) {
              console.error("Error inserting schools:", error);
            }
          }
  
          resolve();
        })
        .on('error', (err: any) => {
          console.error("Error reading CSV from S3:", err);
          reject(err);
        });
    });
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
