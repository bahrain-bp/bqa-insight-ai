import * as AWS from 'aws-sdk';
import csv from 'csv-parser';
//import { title } from 'process';


const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

interface Review {
  Title : string;
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
}

interface UniversityData {
  InstitutionCode: string;
  InstitutionName: string;
  Reviews: Review[];
  AverageJudgement?: number;
}

// Add AWS Error interface
interface AWSError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
  requestId?: string;
  UnprocessedItems?: AWS.DynamoDB.DocumentClient.BatchWriteItemRequestMap;
}

export async function processUniversityReviews(bucket: string, key: string, tableName: string): Promise<void> {
  console.log(`Processing University Reviews from ${bucket}/${key}`);

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const s3Stream = s3.getObject(params).createReadStream();
  const universityMap: Record<string, UniversityData> = {};

  return new Promise((resolve, reject) => {
    s3Stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data: any) => {
        const institutionName = data['Title']?.trim();
        if (!institutionName) {
          console.log('Skipping row - no institution name found:', data);
          return;
        }

        const institutionCode = institutionName.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase();

        const review: Review = {
          Title:data ['Title'] || "",
          Program: data['Program'] || "",
          UnifiedStudyField: data['Unified Study field'] || "",
          Cycle: data['Cycle'] || "",
          Type: data['Type'] || "",
          Judgement: data['Judgement'] || "",
          ReportFile: data['Report File'] || "",
        };

        console.log('Processing review:', {
          institutionCode,
          institutionName,
          review
        });

        if (!universityMap[institutionCode]) {
          universityMap[institutionCode] = {
            InstitutionCode: institutionCode,
            InstitutionName: institutionName,
            Reviews: [],
          };
        }

        universityMap[institutionCode].Reviews.push(review);
      })
      .on('end', async () => {
        const universities = Object.values(universityMap);
        
        console.log('Processed universities:', universities.length);

        universities.forEach(university => {
          const averageJudgement = calculateAverageJudgement(university.Reviews);
          if (averageJudgement !== null) {
            university.AverageJudgement = averageJudgement;
          }
        });

        const chunkSize = 25;
        for (let i = 0; i < universities.length; i += chunkSize) {
            const chunk = universities.slice(i, i + chunkSize);
            const writeParams: AWS.DynamoDB.DocumentClient.BatchWriteItemInput = {
              RequestItems: {
                [tableName]: chunk.map((university) => ({
                  PutRequest: {
                    Item: university,
                  },
                })),
              },
            };
          
            console.log(`Writing chunk ${i/chunkSize + 1} of ${Math.ceil(universities.length/chunkSize)}`);
            
            try {
              const result = await dynamoDb.batchWrite(writeParams).promise();
              console.log('Batch write result:', result);
            } catch (error: unknown) {
              const awsError = error as AWSError;
              console.error("Error during DynamoDB batch write:", {
                message: awsError.message,
                code: awsError.code,
                statusCode: awsError.statusCode,
                requestId: awsError.requestId
              });
              
              // Check for unprocessed items
              if (awsError.UnprocessedItems && Object.keys(awsError.UnprocessedItems).length > 0) {
                console.log('Retrying unprocessed items...');
                try {
                  await dynamoDb.batchWrite({ RequestItems: awsError.UnprocessedItems }).promise();
                } catch (retryError: unknown) {
                  const awsRetryError = retryError as AWSError;
                  console.error("Error during retry:", {
                    message: awsRetryError.message,
                    code: awsRetryError.code,
                    statusCode: awsRetryError.statusCode,
                    requestId: awsRetryError.requestId
                  });
                }
              }
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

function calculateAverageJudgement(reviews: Review[]): number | null {
  const reviewReports = reviews.filter(review => review.Type.toLowerCase() === 'review');

  if (reviewReports.length === 0) return null;

  const judgementScores: { [key: string]: number } = {
    'Confidence': 3,
    'Limited Confidence': 2,
    'No Confidence': 1,
  };

  const judgements: number[] = reviewReports
    .map(review => judgementScores[review.Judgement] || null)
    .filter((judgement): judgement is number => judgement !== null);

  if (judgements.length === 0) return null;

  const sum = judgements.reduce((acc, judgement) => acc + judgement, 0);
  return parseFloat((sum / judgements.length).toFixed(2));
}