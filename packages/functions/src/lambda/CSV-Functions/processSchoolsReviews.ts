import * as AWS from 'aws-sdk';
import csv from 'csv-parser';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

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

export async function processSchoolsReviews(bucket: string, key: string, tableName: string, schoolType: string): Promise<void> {
  console.log(`Processing ${schoolType} from ${bucket}/${key}`);

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const s3Stream = s3.getObject(params).createReadStream();
  const schoolsMap: Record<string, SchoolData> = {};

  return new Promise((resolve, reject) => {
    s3Stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data: any) => {
        console.log('Headers:', Object.keys(data));
        const institutionCode = data['Institution Code']?.trim();
        if (!institutionCode) {
          return;
        }

        const arabicSchoolName = data['School Name A'] || "";
        const englishSchoolName = data['School Name E'] || "";

        const review: Review = {
          Cycle: data['Cycle'] || "omega",
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
        const schools = Object.values(schoolsMap);

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
                    SchoolType: schoolType,
                  },
                },
              })),
            },
          };

          try {
            console.log(JSON.stringify(chunk, null, 2));
            await dynamoDb.batchWrite(writeParams).promise();
            console.log(`Inserted ${chunk.length} ${schoolType} into ${tableName}`);
          } catch (error) {
            console.error(`Error inserting ${schoolType} into ${tableName}:`, error);
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
