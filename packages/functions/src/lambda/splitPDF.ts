import * as AWS from "aws-sdk";
import { PDFDocument } from "pdf-lib";
import { SQSEvent } from "aws-lambda";

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export const sendMessage = async (event: any) => {
    // Extract the bucket name and file key from the S3 notification event
    const records = event.Records;
    
    // Ensure QUEUE_URL environment variable is set
    const queueUrl = process.env.SPLIT_QUEUE_URL;
    if (!queueUrl) {
        throw new Error("SPLIT_QUEUE_URL environment variable is not set.");
    }

    for (const record of records) {
        const bucketName = record.s3.bucket.name;
        const fileKey = record.s3.object.key;

        // Construct the SQS message payload
        const messageBody = JSON.stringify({
            bucketName,
            fileKey,
        });

        // Add the MessageGroupId parameter for FIFO queue
        const sqsMessage = {
            QueueUrl: queueUrl, // This is guaranteed to be a string
            MessageBody: messageBody,
            MessageGroupId: bucketName,  // Use bucket name or any unique string
            MessageDeduplicationId: fileKey, // Optional but recommended for deduplication
        };

        try {
            const result = await sqs.sendMessage(sqsMessage).promise();
            console.log("SQS message sent:", result.MessageId);
        } catch (error) {
            console.error("Error sending SQS message:", error);
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Message sent to SQS" }),
    };
};


export async function handler(event: SQSEvent) {
    for (const record of event.Records) {
        // Parsing the SQS message body to extract file details
        let s3Event;
        try {
            s3Event = JSON.parse(record.body); // Parse the body of the message
        } catch (error) {
            console.error("Error parsing SQS message:", record.body, error);
            continue; // Skip to next record if parsing fails
        }

        const textractQueueUrl = process.env.TEXTRACT_QUEUE_URL!;  // Textract Queue URL

        // Ensure that the required environment variables are set
        if (!textractQueueUrl) {
            throw new Error("TEXTRACT_QUEUE_URL environment variable is not set.");
        }

        const bucketName = s3Event.bucketName;
        const fileKey = s3Event.fileKey;

        if (!bucketName || !fileKey) {
            console.error("Missing bucket name or file key in SQS message:", record.body);
            continue; // Skip to next record if bucket name or file key is missing
        }

        console.log(`Processing file from bucket: ${bucketName}, key: ${fileKey}`);

        try {
            // Get the file from S3
            const object = await s3.getObject({ Bucket: bucketName, Key: fileKey }).promise();

            if (!object.Body) {
                console.error(`File ${fileKey} not found or empty.`);
                continue; // Skip to next record if the file is not found or is empty
            }

            // Process PDF (splitting, etc.)
            const pagesPerFile = 2;  // Adjust as needed
            const pdfChunks = await splitPDF(object.Body as Buffer, pagesPerFile);

            const chunkURLs: string[] = [];
            const chunkKeys: string[] = [];
            for (let i = 0; i < pdfChunks.length; i++) {
                const chunkKey = `SplitFiles/${fileKey.split('/').pop()}/${i}`;
                await s3.putObject({
                    Bucket: bucketName,
                    Key: chunkKey,
                    Body: pdfChunks[i],
                    ContentType: "application/pdf",
                }).promise();

                const chunkURL = `https://${bucketName}.s3.amazonaws.com/${chunkKey}`;
                chunkURLs.push(chunkURL);
                chunkKeys.push(chunkKey);
            }

            console.log(`Successfully split and uploaded PDF: ${fileKey}`);

            // Update DynamoDB metadata
            await updateFileMetadata(fileKey, chunkURLs);
            console.log(`Updated file metadata for ${fileKey} with chunk URLs:`, chunkURLs);

            // Insert empty metadata.json file
            await insertMetadataFile(bucketName, fileKey);

            // Delete the message from the queue after successful processing
            const deleteParams = {
                QueueUrl: process.env.SPLIT_QUEUE_URL!, // Your queue URL (make sure it's available in the environment variables)
                ReceiptHandle: record.receiptHandle, // The receipt handle from the event record
            };
            await sqs.deleteMessage(deleteParams).promise();
            console.log(`Successfully deleted message from the queue: ${record.messageId}`);

            // Send message to Textract queue with chunkURLs
            const textractMessage = {
                QueueUrl: textractQueueUrl,
                MessageBody: JSON.stringify({
                    bucketName,
                    chunkKeys,
                    fileKey,
                }),
                MessageGroupId: bucketName,  // Use the bucket name to group messages if FIFO is enabled
                MessageDeduplicationId: fileKey,  // Use the fileKey for deduplication
            };
            
            const textractResult = await sqs.sendMessage(textractMessage).promise();
            console.log(`Successfully sent message to Textract queue: ${textractResult.MessageId}`);

        } catch (error) {
            console.error(`Error processing file ${fileKey}:`, error);
        }
    }
}

// Function to split the PDF
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

// Function to insert the empty metadata.json file into S3
async function insertMetadataFile(bucketName: string, fileKey: string): Promise<void> {
    const metadataKey = `${fileKey}.metadata.json`;

    // Create an empty JSON object for now
    const metadataContent = JSON.stringify({});

    await s3.putObject({
        Bucket: bucketName,
        Key: metadataKey,
        Body: metadataContent,
        ContentType: "application/json",
    }).promise();
}

// Function to update metadata in DynamoDB
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
    console.log(`Inserted chunk URLs for ${fileKey} into DynamoDB`);
}
