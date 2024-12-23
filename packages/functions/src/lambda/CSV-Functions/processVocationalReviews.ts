
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

interface VocationalData {
  InstitutionCode: string;
  ArabicInstituteName: string;
  EnglishInstituteName: string;
  Reviews: Review[];
  AverageGrade?: number;
}

export async function processVocationalReviews(bucket: string, key: string, tableName: string): Promise<void> {
  console.log(`Processing Vocational Reviews from ${bucket}/${key}`);

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const s3Stream = s3.getObject(params).createReadStream();
  const vocationalMap: Record<string, VocationalData> = {};

  return new Promise((resolve, reject) => {
    s3Stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data: any) => {
        const institutionCode = data['Institution Code']?.trim();
        if (!institutionCode) {
          return;
        }

        const arabicInstituteName = data['Institution Name A'] || "";
        const englishInstituteName = data['Institution NameE'] || "";

        const review: Review = {
          Cycle: data['Cycle'] || "",
          Batch: data['Batch'] || "",
          BatchReleaseDate: data['Batch Release Date'] || "",
          ReviewType: data['Review Type'] || "",
          Grade: data['Grade'] || "",
        };

        if (!vocationalMap[institutionCode]) {
          vocationalMap[institutionCode] = {
            InstitutionCode: institutionCode,
            ArabicInstituteName: arabicInstituteName,
            EnglishInstituteName: englishInstituteName,
            Reviews: [],
          };
        }

        vocationalMap[institutionCode].Reviews.push(review);
      })
      .on('end', async () => {
        const vocationals = Object.values(vocationalMap);

        vocationals.forEach(vocational => {
          // Calculate average grade for all vocational institutes
          const averageGrade = calculateAverageGrade(vocational.Reviews);
          if (averageGrade !== null) {
            vocational.AverageGrade = averageGrade;
          }
        });

        const chunkSize = 25; // DynamoDB BatchWrite limit
        for (let i = 0; i < vocationals.length; i += chunkSize) {
          const chunk = vocationals.slice(i, i + chunkSize);
          const writeParams: AWS.DynamoDB.DocumentClient.BatchWriteItemInput = {
            RequestItems: {
              [tableName]: chunk.map((vocational) => {
                const item: Record<string, any> = {
                  InstitutionCode: vocational.InstitutionCode,
                  EnglishInstituteName: vocational.EnglishInstituteName,
                  ArabicInstituteName: vocational.ArabicInstituteName,
                  Reviews: vocational.Reviews,
                  AverageGrade: vocational.AverageGrade !== undefined ? vocational.AverageGrade : null,
                };

                return {
                  PutRequest: {
                    Item: item,
                  },
                };
              }),
            },
          };

          try {
            console.log(`Writing ${chunk.length} items to ${tableName}`);
            await dynamoDb.batchWrite(writeParams).promise();
          } catch (error) {
            console.error(`Error inserting Vocational Reviews into ${tableName}:`, error);
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

function calculateAverageGrade(reviews: Review[]): number | null {
  // Filter reviews with "Review Report," "Repeat review," or "Review" in their ReviewType
  const reviewReports = reviews.filter(review =>
    ["Review Report", "Repeat review", "Review"].some(type => review.ReviewType.includes(type))
  );

  if (reviewReports.length === 0) return null;

  const grades: number[] = reviewReports.map(review => {
    const match = review.Grade.match(/^\((\d)\)/);
    return match ? parseInt(match[1], 10) : null;
  }).filter((grade): grade is number => grade !== null);

  if (grades.length === 0) return null;

  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  const average = sum / grades.length;

  return parseFloat(average.toFixed(2));
}

