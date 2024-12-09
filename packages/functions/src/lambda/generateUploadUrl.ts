import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

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

