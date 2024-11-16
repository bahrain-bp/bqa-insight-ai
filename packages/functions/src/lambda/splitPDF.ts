import * as AWS from "aws-sdk";
import { PDFDocument } from "pdf-lib";

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export async function handler(event: any) {
    for (const record of event.Records) {
        const { bucketName, fileKey, uniqueId } = JSON.parse(record.body);

        try {
            // Get the file directly from S3
            const object = await s3.getObject({ Bucket: bucketName, Key: fileKey }).promise();

            if (!object.Body) {
                console.error(`File ${fileKey} not found or empty.`);
                continue;
            }

            // Split the PDF using pdf-lib
            const pagesPerFile = 2; // Set the number of pages per split file
            const pdfChunks = await splitPDF(object.Body as Buffer, pagesPerFile);

            const chunkURLs: string[] = []; // Store URLs of the split files

            // Upload split files back to S3
            for (let i = 0; i < pdfChunks.length; i++) {
                const chunkKey = `SplitFiles/${uniqueId}/${i}`;
                await s3.putObject({
                    Bucket: bucketName,
                    Key: chunkKey,
                    Body: pdfChunks[i],
                    ContentType: "application/pdf",
                }).promise();

                // Generate the URL for each chunk
                const chunkURL = `https://${bucketName}.s3.amazonaws.com/${chunkKey}`;
                chunkURLs.push(chunkURL);
            }

            console.log(`Successfully split and uploaded PDF: ${fileKey}`);

            // Update DynamoDB to append the URLs
            await updateFileMetadata(fileKey, chunkURLs);

            console.log(`Updated file metadata for ${fileKey} with chunk URLs:`, chunkURLs);

            // Delete the message from the SQS queue after successful processing
            await sqs
                .deleteMessage({
                    QueueUrl: process.env.SQS_QUEUE_URL as string,
                    ReceiptHandle: record.receiptHandle,
                })
                .promise();

            console.log(`Deleted message for file: ${fileKey}`);
        } catch (error) {
            console.error(`Error processing file ${fileKey}:`, error);
        }
    }
}

async function splitPDF(buffer: Buffer, pagesPerFile: number): Promise<Uint8Array[]> {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    const splitBuffers: Uint8Array[] = [];

    for (let i = 0; i < pages.length; i += pagesPerFile) {
        const newPdf = await PDFDocument.create();
        const pageSubset = pages.slice(i, i + pagesPerFile);

        for (const page of pageSubset) {
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [pages.indexOf(page)]);
            newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        splitBuffers.push(pdfBytes);
    }

    return splitBuffers;
}

async function updateFileMetadata(fileKey: string, chunkURLs: string[]): Promise<void> {
    const params = {
        TableName: process.env.FILE_METADATA_TABLE_NAME as string,
        Key: { fileKey },
        UpdateExpression: "SET splitFileURLs = list_append(if_not_exists(splitFileURLs, :empty_list), :newURLs)",
        ExpressionAttributeValues: {
            ":newURLs": chunkURLs,
            ":empty_list": [],
        },
        ReturnValues: "UPDATED_NEW",
    };

    await dynamoDb.update(params).promise();
    console.log(`Updated file metadata for ${fileKey} with chunk URLs:`, chunkURLs);
}
