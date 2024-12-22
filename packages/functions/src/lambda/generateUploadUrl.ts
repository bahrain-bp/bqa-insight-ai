import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Define allowed MIME types
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/csv"]);

// Define exact allowed CSV filenames
const ALLOWED_CSV_FILENAMES = new Set([
  "Results of Government Schools Reviews.csv",
  "Results of Higher Education Reviews.csv",
  "Results of National Framework Operations.csv",
  "Results of Private Schools Reviews.csv",
  "Results of Vocational Reviews.csv",
]);

export async function handler(event: any) {
    const { files } = JSON.parse(event.body); // `files` should be an array of { fileName, fileType, fileSize }
    console.log("Bucket Name:", process.env.BUCKET_NAME);

    const bucketName = process.env.BUCKET_NAME as string;
    if (!bucketName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Bucket name is not defined in environment variables" }),
        };
    }

    const uploadURLs = [];

    for (const file of files) {
        const { fileName, fileType, fileSize } = file;

        if (!ALLOWED_MIME_TYPES.has(fileType)) {
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: `Unsupported file type: ${fileType} for file ${fileName}. Only PDF and CSV files are allowed.`,
              }),
            };
        }

        if (fileType === "text/csv") {
            // Validate exact CSV filename
            if (!ALLOWED_CSV_FILENAMES.has(fileName)) {
              return {
                statusCode: 400,
                body: JSON.stringify({
                  error: `Invalid CSV file name: ${fileName}. Please use one of the allowed filenames.`,
                }),
              };
            }
        }

        const uniqueId = uuidv4(); 
        // Set the fileKey with the uniqueId
        let fileKey = `Files/${uniqueId}`;
        // If the file is a PDF, ensure the key ends with .pdf
        if (fileType === "application/pdf" && !fileKey.endsWith(".pdf")) {
            fileKey = `Files/${uniqueId}.pdf`;
        }

        const params = {
            Bucket: bucketName,
            Key: fileKey,
            Expires: 60,
            ContentType: fileType,
        };

        try {
            const uploadURL = await s3.getSignedUrlPromise("putObject", params);
            uploadURLs.push({ fileName, fileKey, uploadURL });

            await insertFileMetadata({ fileKey, fileName, fileType, fileSize });

        } catch (error) {
            console.error("Error processing file:", fileName, error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `Failed to process file ${fileName}` }),
            };
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ uploadURLs }),
    };
}

// Insert file metadata into DynamoDB
async function insertFileMetadata(file: { fileKey: string; fileName: string; fileType: string; fileSize: number }) {
    const params = {
        TableName: process.env.FILE_METADATA_TABLE_NAME as string,
        Item: {
            fileKey: file.fileKey,
            fileName: file.fileName,
            fileURL: `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${file.fileKey}`,
            fileSize: file.fileSize,
            fileType: file.fileType,
            uploadedAt: new Date().toISOString(),
        },
    };
    return await dynamoDb.put(params).promise();
}

