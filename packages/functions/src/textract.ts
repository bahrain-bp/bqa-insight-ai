import { APIGatewayEvent, Context } from "aws-lambda";
import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand, AnalyzeDocumentCommand, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from "@aws-sdk/client-textract";

// type for the request
interface TextractRequest {
  bucketName: string;
  objectKey: string;
}

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

// function to proccess the response from textract
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
                .map(row => 
                    row
                        .sort((a, b) => a.ColumnIndex - b.ColumnIndex)
                        .map(cell => cell.Text?.trim() || "")
                        .filter(text => text.length > 0)
                        .join(" | ")
                )
                .filter(row => row.length > 0)
                .join("\n");

            return tableText;
        })
        .filter((text) => text.length > 0);

        return [...lineBlocks, ...tableBlocks].join('\n\n');
}

const textractClient = new TextractClient({ region: "us-east-1" });

export const extractTextFromPDF = async (event: APIGatewayEvent, context: Context) => {
  try {
    const requestBody: TextractRequest = JSON.parse(event.body || "{}");
    console.log("Request Body:", requestBody);

    const bucketName = requestBody.bucketName;
    const objectKey = requestBody.objectKey;

    // Use Textract to start document text detection
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

    // Check if the text detection job started successfully
    if (!startTextDetectionResponse.JobId) {
      throw new Error("Failed to start document text detection job.");
    }

    if (!startDocumentAnalysisResponse.JobId) {
      throw new Error("Failed to start document text detection job.");
    }
    
    const documentAnalysisJobId = startDocumentAnalysisResponse.JobId;

    const getDocumentAnalysisCommand = new GetDocumentAnalysisCommand({
      JobId: documentAnalysisJobId
    })

    const textRactJobId = startTextDetectionResponse.JobId;
    const getDocumentTextDetectionCommand = new GetDocumentTextDetectionCommand({
      JobId: textRactJobId,
    });
    const textDetectionResult = await tryTextract(getDocumentTextDetectionCommand);

    let extractedText = "";
    if (textDetectionResult.Blocks) {
        extractedText = processBlocks(textDetectionResult.Blocks)
    }

    extractedText = extractedText.replaceAll("\n\n", " ")

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
