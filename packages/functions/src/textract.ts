import { APIGatewayEvent, Context } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";

// type for the request
interface TextractRequest {
  bucketName: string;
  objectKey: string;
}

// type for processing the blocks
interface Block {
  BlockType?: string;
  Text?: string;
}

// function to proccess the response from textract
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

    return lineBlocks.join(' ');
}

const s3Client = new S3Client({ region: "us-east-1" });
const textractClient = new TextractClient({ region: "us-east-1" });

export const extractTextFromPDF = async (event: APIGatewayEvent, context: Context) => {
  try {
    const requestBody: TextractRequest = JSON.parse(event.body || "{}");
    console.log("Request Body:", requestBody);

    const bucketName = requestBody.bucketName;
    const objectKey = requestBody.objectKey;

    // Download the PDF from S3
    // const getObjectCommand = new GetObjectCommand({
    //   Bucket: bucketName,
    //   Key: objectKey,
    // });

    // const pdfData = await s3Client.send(getObjectCommand);

    // if (!pdfData.Body) {
    //     throw new Error('Document body is empty');
    // }

    // Use Textract to start document text detection
    const startDocumentTextDetectionCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucketName,
          Name: objectKey,
        },
      },
    });

    const startTextDetectionResponse = await textractClient.send(startDocumentTextDetectionCommand);

    // Check if the text detection job started successfully
    if (!startTextDetectionResponse.JobId) {
      throw new Error("Failed to start document text detection job.");
    }

    const textRactJobId = startTextDetectionResponse.JobId;
    const getDocumentTextDetectionCommand = new GetDocumentTextDetectionCommand({
      JobId: textRactJobId,
    });
    const textDetectionResult = await tryTextract(getDocumentTextDetectionCommand);

    let extractedText = "";
    if (textDetectionResult.Blocks) {
        extractedText = processBlocks(textDetectionResult.Blocks)
    }
    console.log("Extracted Text:", extractedText);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Text extracted successfully",
        text: extractedText,
      }),
    };
  } catch (error) {
    console.error("Error fetching text from file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch text from file" }),
    };
  }
};

// Function to wait for document text detection job completion
async function tryTextract(command: GetDocumentTextDetectionCommand): Promise<any> {
  const maxRetries = 5;
  let retries = 0;
  while (retries < maxRetries) {
    const response = await textractClient.send(command);
    if (response.JobStatus === "SUCCEEDED" || response.JobStatus === "FAILED") {
      return response;
    } else if (response.JobStatus === "PARTIAL_SUCCESS") {
        // Wait for 5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000)); 
        retries++;
    }
    
  }
  throw new Error("Text detection job failed");
}