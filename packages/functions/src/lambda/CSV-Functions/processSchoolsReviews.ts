// src/processSchoolsReviews.ts

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
  SchoolLevel?: string;
  SchoolGender?: string;
  AverageGrade?: number;
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

        schools.forEach(school => {
          const englishName = school.EnglishSchoolName;
          const arabicName = school.ArabicSchoolName;

          if (schoolType === "Government") {
            // Parse SchoolLevel from English name
            let level = parseSchoolLevel(englishName);
            // Fallback to Arabic if not found in English
            if (!level) {
              level = parseSchoolLevelArabic(arabicName);
            }
            if (level) {
              school.SchoolLevel = level;
            }

            // Parse SchoolGender: first try English, then Arabic
            let gender = parseSchoolGenderEnglish(englishName);
            if (!gender) {
              gender = parseSchoolGenderArabic(arabicName);
            }
            if (gender) {
              school.SchoolGender = gender;
            }
          }

          // Calculate average grade for all schools
          const averageGrade = calculateAverageGrade(school.Reviews);
          if (averageGrade !== null) {
            school.AverageGrade = averageGrade;
          }
        });

        const chunkSize = 25;
        for (let i = 0; i < schools.length; i += chunkSize) {
          const chunk = schools.slice(i, i + chunkSize);
          const writeParams: AWS.DynamoDB.DocumentClient.BatchWriteItemInput = {
            RequestItems: {
              [tableName]: chunk.map((school) => {
                const item: Record<string, any> = {
                  InstitutionCode: school.InstitutionCode,
                  EnglishSchoolName: school.EnglishSchoolName,
                  ArabicSchoolName: school.ArabicSchoolName,
                  SchoolType: schoolType,
                  Reviews: school.Reviews,
                  AverageGrade: school.AverageGrade !== undefined ? school.AverageGrade : null,
                };

                if (schoolType === "Government") {
                  if (school.SchoolLevel) {
                    item.SchoolLevel = school.SchoolLevel;
                  }
                  if (school.SchoolGender) {
                    item.SchoolGender = school.SchoolGender;
                  }
                }

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

function calculateAverageGrade(reviews: Review[]): number | null {
  const reviewReports = reviews.filter(review => review.ReviewType === "Review Report");

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

function parseSchoolLevel(englishName: string): string | undefined {
  const levels = ["Primary", "Intermediate", "Secondary"];
  const foundLevels: string[] = [];

  levels.forEach(level => {
    const regex = new RegExp(level, 'i');
    if (regex.test(englishName)) {
      foundLevels.push(level);
    }
  });

  if (foundLevels.length > 0) {
    return Array.from(new Set(foundLevels)).join(',');
  }

  return undefined;
}

function parseSchoolLevelArabic(arabicName: string): string | undefined {
  const levelMappings: { [key: string]: string } = {
    "الابتدائية": "Primary",
    "الإعدادية": "Intermediate",
    "الثانوية": "Secondary",
  };

  for (const [arabic, english] of Object.entries(levelMappings)) {
    if (arabicName.includes(arabic)) {
      return english;
    }
  }

  return undefined;
}

function parseSchoolGenderEnglish(englishName: string): string | undefined {
  const genders = ["Boys", "Girls"];
  for (const gender of genders) {
    const regex = new RegExp(gender, 'i');
    if (regex.test(englishName)) {
      return gender;
    }
  }
  return undefined;
}

function parseSchoolGenderArabic(arabicName: string): string | undefined {
  if (/بنين/.test(arabicName)) {
    return "Boys";
  }
  if (/بنات/.test(arabicName)) {
    return "Girls";
  }
  return undefined;
}
