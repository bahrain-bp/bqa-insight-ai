import { SQSEvent } from "aws-lambda";
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
} from "@aws-sdk/client-textract";

// type for processing the blocks
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

// type for processing the cells
interface Cell {
  RowIndex: number;
  ColumnIndex: number;
  Text?: string;
}

// function to process the response from Textract
// (tables processing might need to be changed for vertical text)
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

      // Group cells by row
      const rows = table.Cells.reduce((acc: { [key: number]: Cell[] }, cell) => {
        const rowIndex = cell.RowIndex;
        if (!acc[rowIndex]) {
          acc[rowIndex] = [];
        }
        acc[rowIndex].push(cell);
        return acc;
      }, {});

      // Convert rows to text
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

const textractClient = new TextractClient({ region: "us-east-1" });

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
        continue; // Skip to the next record if parsing fails
      }

      const chunkURLs = sqsEvent.chunkURLs; // Assuming chunkURLs is part of the message
      if (!chunkURLs || chunkURLs.length === 0) {
        console.error("No chunk URLs found in the SQS message:", record.body);
        continue; // Skip if no chunk URLs are provided
      }

      console.log(`Processing chunk URLs: ${chunkURLs}`);

      await Promise.all(
        chunkURLs.map(async (chunkURL: string, i: number) => {
          const bucketName = chunkURL.split("/")[2]; // Extract bucket name from URL
          const objectKey = chunkURL.split("/").slice(3).join("/"); // Extract object key

          // Start Textract jobs for text detection and analysis
          const startDocumentTextDetectionCommand = new StartDocumentTextDetectionCommand({
            DocumentLocation: {
              S3Object: {
                Bucket: bucketName,
                Name: objectKey,
              },
            },
          });

          const startDocumentAnalysisCommand = new StartDocumentAnalysisCommand({
            DocumentLocation: {
              S3Object: {
                Bucket: bucketName,
                Name: objectKey,
              },
            },
            FeatureTypes: ["TABLES"],
          });

          const startTextDetectionResponse = await textractClient.send(startDocumentTextDetectionCommand);
          const startDocumentAnalysisResponse = await textractClient.send(startDocumentAnalysisCommand);

          if (!startTextDetectionResponse.JobId || !startDocumentAnalysisResponse.JobId) {
            throw new Error("Failed to start Textract jobs.");
          }

          // Fetch the text detection results
          const textDetectionResult = await tryTextract(new GetDocumentTextDetectionCommand({
            JobId: startTextDetectionResponse.JobId!,
          }));

          // Fetch the document analysis results
          const documentAnalysisResult = await tryTextract(new GetDocumentAnalysisCommand({
            JobId: startDocumentAnalysisResponse.JobId!,
          }));

          let extractedText = "";

          if (textDetectionResult.Blocks) {
            extractedText = processBlocks(textDetectionResult.Blocks);
          }

          result[i] = extractedText; // Store the result for each chunk
        })
      );

      // Combine all the results from the chunks
      resultText = result.join(" ");

      console.log("Extracted Text:", resultText);
    }

    // Final response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Text extracted successfully from all chunks",
        text: resultText,
      }),
    };
  } catch (error) {
    console.error("Error processing SQS message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to extract text from files",
      }),
    };
  }
}
