import { S3Event, Context } from 'aws-lambda';
import { processSchoolsReviews } from './CSV-Functions/processSchoolsReviews';
import { emptySchoolTable } from './CSV-Functions/emptySchoolTable';
import { processVocationalReviews } from './CSV-Functions/processVocationalReviews';
import { processHigherEducationProgrammeReviews } from './CSV-Functions/processHigherEducationProgrammeReviews';
import { emptyTable } from './CSV-Functions/emptyTable';

export async function handler(event: S3Event, context: Context): Promise<void> {
    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        console.log(`Bucket: ${bucketName}, File: ${objectKey}`);

        switch (objectKey) {
            case 'CSVFiles/Results of Government Schools Reviews.csv':
                await emptySchoolTable(process.env.SCHOOL_REVIEWS_TABLE_NAME!, "Government");
                await processSchoolsReviews(bucketName, objectKey, process.env.SCHOOL_REVIEWS_TABLE_NAME!, 'Government');
                break;
            case 'CSVFiles/Results of Private Schools Reviews.csv':
                await emptySchoolTable(process.env.SCHOOL_REVIEWS_TABLE_NAME!, "Private");
                await processSchoolsReviews(bucketName, objectKey, process.env.SCHOOL_REVIEWS_TABLE_NAME!, 'Private');
                break;
            case 'CSVFiles/Results of Higher Education Reviews.csv':
                await processHigherEducationProgrammeReviews(bucketName, objectKey, process.env.HIGHER_EDUCATION_PROGRAMME_REVIEWS_TABLE_NAME!);
                break;
            case 'CSVFiles/Results of National Framework Operations.csv':
                await processNationalFrameworkOperations(bucketName, objectKey);
                break;
            case 'CSVFiles/Results of Vocational Reviews.csv':
                await emptyTable(process.env.VOCATIONAL_REVIEWS_TABLE_NAME!);
                await processVocationalReviews(bucketName, objectKey, process.env.VOCATIONAL_REVIEWS_TABLE_NAME!);
                break;
            default:
                console.warn(`No processing function defined for file: ${objectKey}`);
        }
    }
}



async function processNationalFrameworkOperations(bucket: string, key: string): Promise<void> {
    console.log(`Processing National Framework Operations from ${bucket}/${key}`);
    // Implement specific processing logic here
}

