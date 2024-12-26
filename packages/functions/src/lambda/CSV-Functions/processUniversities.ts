import * as AWS from 'aws-sdk';
import csv from 'csv-parser';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

interface Review {
 Title: string;
 Program: string; 
 UnifiedStudyField: string;
 Cycle: string;
 Type: string;
 Judgement: string;
 ReportFile: string;
}

interface UniversityData {
 InstitutionCode: string;
 ArabicInstituteName: string;
 EnglishInstituteName: string;
 Reviews: Review[];
 AverageJudgement?: number;
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
       const institutionCode = data['Institution Code']?.trim();
       if (!institutionCode) {
         return;
       }

       const arabicInstituteName = data['Institution Name A'] || "";
       const englishInstituteName = data['Institution Name E'] || "";

       const review: Review = {
         Title: data['Title'] || "",
         Program: data['Program'] || "",
         UnifiedStudyField: data['Unified Study field'] || "",
         Cycle: data['Cycle'] || "",
         Type: data['Type'] || "",
         Judgement: data['Judgement'] || "",
         ReportFile: data['Report File'] || ""
       };

       if (!universityMap[institutionCode]) {
         universityMap[institutionCode] = {
           InstitutionCode: institutionCode,
           ArabicInstituteName: arabicInstituteName,
           EnglishInstituteName: englishInstituteName,
           Reviews: [],
         };
       }

       universityMap[institutionCode].Reviews.push(review);
     })
     .on('end', async () => {
       const universities = Object.values(universityMap);

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
                 Item: {
                   InstitutionCode: university.InstitutionCode,
                   EnglishInstituteName: university.EnglishInstituteName,
                   ArabicInstituteName: university.ArabicInstituteName,
                   Reviews: university.Reviews,
                   AverageJudgement: university.AverageJudgement !== undefined ? university.AverageJudgement : null,
                 },
               },
             })),
           },
         };

         try {
           console.log(`Writing ${chunk.length} items to ${tableName}`);
           await dynamoDb.batchWrite(writeParams).promise();
         } catch (error) {
           console.error(`Error inserting University Reviews into ${tableName}:`, error);
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
 const reviewReports = reviews.filter(review => review.Type.toLowerCase().includes('review'));

 if (reviewReports.length === 0) return null;

 const judgements: number[] = reviewReports.map(review => {
   const match = review.Judgement.match(/^\((\d)\)/);
   return match ? parseInt(match[1], 10) : null;
 }).filter((judgement): judgement is number => judgement !== null);

 if (judgements.length === 0) return null;

 const sum = judgements.reduce((acc, judgement) => acc + judgement, 0);
 return parseFloat((sum / judgements.length).toFixed(2));
}