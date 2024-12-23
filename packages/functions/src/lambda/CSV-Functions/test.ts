import * as AWS from 'aws-sdk';
import csv from 'csv-parser';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

interface Review {
  Cycle: string;
  Batch: string;
  Number: string;
  ReviewType: string;
  GeneralConfidenceLevel: string;
}

interface Programme {
  ProgrammeName: string;
  Reviews: Review[];
}

interface Institution {
  InstitutionEnglishName: string;
  InstitutionArabicName: string;
  Programmes: Programme[];
}

export async function processHigherEducationProgrammeReviews(bucket: string, key: string, tableName: string): Promise<void> {
  console.log(`Processing Higher Education Programme Reviews from ${bucket}/${key}`);

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const s3Stream = s3.getObject(params).createReadStream();
  const institutionMap: Record<string, Institution> = {};

  return new Promise((resolve, reject) => {
    s3Stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data: any) => {
        const institutionEnglishName = data['Institution Name E']?.trim();
        const institutionArabicName = data['Institution Name A']?.trim();
        if (!institutionEnglishName) {
          return;
        }

        const rawProgrammeName = data['Programme Name']?.trim() || '';
        const programmeName = extractEnglishProgrammeName(rawProgrammeName);

        const review: Review = {
          Cycle: data['Cycle']?.trim() || '',
          Batch: data['Batch']?.trim() || '',
          Number: data['No#']?.trim() || '',
          ReviewType: data['Review Type']?.trim() || '',
          GeneralConfidenceLevel: data['General Confidence level']?.trim() || '',
        };

        if (!institutionMap[institutionEnglishName]) {
          institutionMap[institutionEnglishName] = {
            InstitutionEnglishName: institutionEnglishName,
            InstitutionArabicName: institutionArabicName || '',
            Programmes: [],
          };
        }

        const institution = institutionMap[institutionEnglishName];

        let programme = institution.Programmes.find(p => p.ProgrammeName === programmeName);
        if (!programme) {
          programme = {
            ProgrammeName: programmeName,
            Reviews: [],
          };
          institution.Programmes.push(programme);
        }

        programme.Reviews.push(review);
      })
      .on('end', async () => {
        const institutions = Object.values(institutionMap);

        const chunkSize = 25;
        for (let i = 0; i < institutions.length; i += chunkSize) {
          const chunk = institutions.slice(i, i + chunkSize);
          const writeParams: AWS.DynamoDB.DocumentClient.BatchWriteItemInput = {
            RequestItems: {
              [tableName]: chunk.map((institution) => ({
                PutRequest: {
                  Item: {
                    InstitutionEnglishName: institution.InstitutionEnglishName,
                    InstitutionArabicName: institution.InstitutionArabicName,
                    Programmes: institution.Programmes,
                  },
                },
              })),
            },
          };

          try {
            console.log(`Writing ${chunk.length} items to ${tableName}`);
            await dynamoDb.batchWrite(writeParams).promise();
          } catch (error) {
            console.error(`Error inserting into ${tableName}:`, error);
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

function extractEnglishProgrammeName(rawName: string): string {
  // Extract English part of the name before "-" or new line
  const match = rawName.match(/^[^\-\n]+/);
  return match ? match[0].trim() : rawName.trim();
}
