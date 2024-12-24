import * as AWS from "aws-sdk";
import { SQSEvent } from "aws-lambda";
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
} from "@aws-sdk/client-textract";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize the SQS client from AWS SDK v2
const sqs = new AWS.SQS();
const s3Client = new S3Client({ region: "us-east-1" });
const textractClient = new TextractClient({ region: "us-east-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Retrieve the queue URL from the environment
const queueUrl = process.env.TEXTRACT_QUEUE_URL; // Ensure this environment variable is set

interface Block {
  BlockType?: string;
  Text?: string;
  Relationships?: Array<{
    Type: string;
    Ids: string[];
  }>;
  Id: string;
  Cells?: Cell[];
}

interface Cell {
  RowIndex: number;
  ColumnIndex: number;
  Text?: string;
}

const processBlocks = (blocks: Block[]): string => {
  if (!blocks || blocks.length === 0) {
    return "";
  }
  const lineBlocks = blocks
    .filter((block) => block.BlockType === "LINE")
    .map((block) => {
      const text = block.Text || "";
      return text.trim();
    })
    .filter((text) => text.length > 0);

  const tableBlocks = blocks
    .filter((block) => block.BlockType === "TABLE")
    .map((table) => {
      if (!table.Cells || table.Cells.length === 0) {
        return "";
      }

      const rows = table.Cells.reduce((acc: { [key: number]: Cell[] }, cell) => {
        const rowIndex = cell.RowIndex;
        if (!acc[rowIndex]) {
          acc[rowIndex] = [];
        }
        acc[rowIndex].push(cell);
        return acc;
      }, {});

      const tableText = Object.values(rows)
        .map((row) =>
          row
            .sort((a, b) => a.ColumnIndex - b.ColumnIndex)
            .map((cell) => cell.Text?.trim() || "")
            .filter((text) => text.length > 0)
            .join(" | ")
        )
        .filter((row) => row.length > 0)
        .join("\n");

      return tableText;
    })
    .filter((text) => text.length > 0);

  return [...lineBlocks, ...tableBlocks].join(" ");
};

// Function to wait for document text detection job completion
async function tryTextract(command: GetDocumentTextDetectionCommand): Promise<any> {
  const maxRetries = 10;
  let retries = 0;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  while (retries < maxRetries) {
    try {
      const response = await textractClient.send(command);
      if (response.JobStatus === "SUCCEEDED" || response.JobStatus === "FAILED") {
        return response;
      } else if (response.JobStatus === "PARTIAL_SUCCESS") {
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Retrying after ${waitTime / 1000} seconds...`);
        await delay(waitTime);
        retries++;
      }
    } catch (error: any) {
      console.error("Textract request failed:", error);
      if (error.name === 'ProvisionedThroughputExceededException') {
        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`ProvisionedThroughputExceededException - retrying after ${waitTime / 1000} seconds...`);
        await delay(waitTime);
        retries++;
      } else {
        throw error;
      }
    }
  }

  throw new Error("Text detection job failed after retries.");
}

// Function to upload the extracted text as a .txt file to S3
async function uploadTextToS3(bucketName: string, fileKey: string, resultText: string): Promise<void> {
  const cleanFileKey = fileKey.startsWith('Files/') ? fileKey.slice(6) : fileKey;

  const textFileKey = `TextFiles/${cleanFileKey}.txt`;

  try {
    // Upload the extracted text as a .txt file to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: textFileKey,
      Body: resultText,
      ContentType: "text/plain",
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    console.log(`Successfully uploaded ${textFileKey} to ${bucketName}`);

    // Generate the URL of the uploaded .txt file
    const textFileUrl = `https://${bucketName}.s3.amazonaws.com/${textFileKey}`;

    // Update the DynamoDB table with the new URL in a new column 'textFileURL'
    const params = {
      TableName: process.env.FILE_METADATA_TABLE_NAME as string,
      Key: { fileKey },
      UpdateExpression: "SET textFileURL = :newURL", // New column for text file URL
      ExpressionAttributeValues: {
        ":newURL": textFileUrl, // Store the single URL
      },
      ReturnValues: "UPDATED_NEW",
    };

    await dynamoDb.update(params).promise();
    console.log(`Inserted .txt file URL for ${fileKey} into 'textFileURL' column in DynamoDB`);

  } catch (error) {
    console.error(`Error uploading ${textFileKey} to ${bucketName}:`, error);
  }
}

// Function to delete the SQS message after successful processing
async function deleteSQSMessage(receiptHandle: string): Promise<void> {
  if (!queueUrl) {
    console.error("Queue URL is not available in the environment.");
    return;
  }

  const deleteParams = {
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
  };

  try {
    await sqs.deleteMessage(deleteParams).promise();
    console.log("SQS message deleted successfully");
  } catch (error) {
    console.error("Error deleting SQS message:", error);
  }
}
// Function to send a message to the extract metadata queue
async function sendMessageToExtractMetadataQueue(text: string, fileKey: string): Promise<void> {
  const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL; // Ensure this environment variable is set

  if (!extractMetadataQueueUrl) {
    console.error("Extract metadata queue URL is not available in the environment.");
    return;
  }

  const params = {
    QueueUrl: extractMetadataQueueUrl,
    MessageBody: JSON.stringify({ text: text, fileKey }), // Include both resultText and fileKey
    MessageGroupId: "MetadataProcessing", // Required for FIFO queues
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log("Message sent to extract metadata queue successfully:");
  } catch (error) {
    console.error("Error sending message to extract metadata queue:", error);
  }
}


// SQS event handler
export async function handler(event: SQSEvent) {
  try {
    const result: string[] = [];
    let resultText: string = "";

    for (const record of event.Records) {
      let sqsEvent;
      try {
        sqsEvent = JSON.parse(record.body); // Parse the body of the SQS message
      } catch (error) {
        console.error("Error parsing SQS message:", record.body, error);
        continue;
      }

      const bucketName = sqsEvent.bucketName;
      const chunkKeys = sqsEvent.chunkKeys;
      const fileKey = sqsEvent.fileKey;

      if (!bucketName || !chunkKeys || chunkKeys.length === 0 || !fileKey) {
        console.error("Invalid message content: missing bucketName, chunkKeys, or fileKey:", record.body);
        continue;
      }

      console.log(`Processing chunk keys for bucket: ${bucketName}`, chunkKeys);

      // Process each chunkKey in the array
      await Promise.all(
        chunkKeys.map(async (chunkKey: string, i: number) => {
          const startDocumentTextDetectionCommand = new StartDocumentTextDetectionCommand({
            DocumentLocation: {
              S3Object: {
                Bucket: bucketName,
                Name: chunkKey,
              },
            },
          });

          const startDocumentAnalysisCommand = new StartDocumentAnalysisCommand({
            DocumentLocation: {
              S3Object: {
                Bucket: bucketName,
                Name: chunkKey,
              },
            },
            FeatureTypes: ["TABLES"],
          });

          try {
            const startTextDetectionResponse = await textractClient.send(startDocumentTextDetectionCommand);
            const startDocumentAnalysisResponse = await textractClient.send(startDocumentAnalysisCommand);

            if (!startTextDetectionResponse.JobId || !startDocumentAnalysisResponse.JobId) {
              throw new Error(`Failed to start Textract jobs for chunk: ${chunkKey}`);
            }

            const textDetectionResult = await tryTextract(new GetDocumentTextDetectionCommand({
              JobId: startTextDetectionResponse.JobId!,
            }));

            const documentAnalysisResult = await tryTextract(new GetDocumentAnalysisCommand({
              JobId: startDocumentAnalysisResponse.JobId!,
            }));

            let extractedText = "";

            if (textDetectionResult.Blocks) {
              extractedText = processBlocks(textDetectionResult.Blocks);
            }

            result[i] = extractedText;

          } catch (error) {
            console.error(`Error processing chunk: ${chunkKey}`, error);
          }
        })
      );

      resultText = result.join(" ");

      // Upload the resultText to the S3 bucket as a .txt file
      await uploadTextToS3(bucketName, fileKey, resultText);

      // Delete the SQS message after successful processing
      await deleteSQSMessage(record.receiptHandle);
      await sendMessageToExtractMetadataQueue(resultText, fileKey);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Text extracted, uploaded, and SQS message deleted successfully from all chunks",
      }),
    };
  } catch (error) {
    console.error("Error processing SQS message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to extract, upload text, or delete SQS message from files",
      }),
    };
  }
}
