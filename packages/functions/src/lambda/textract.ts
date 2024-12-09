// textract.ts
import {
    TextractClient,
    StartDocumentTextDetectionCommand,
    GetDocumentTextDetectionCommand,
    StartDocumentAnalysisCommand,
    GetDocumentAnalysisCommand,
} from "@aws-sdk/client-textract";

const textractClient = new TextractClient({ region: "us-east-1" });

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

export async function extractTextFromPDF(bucketName: string, fileKey: string): Promise<string> {
    const startDocumentTextDetectionCommand = new StartDocumentTextDetectionCommand({
        DocumentLocation: {
            S3Object: {
                Bucket: bucketName,
                Name: fileKey,
            },
        },
    });

    const startDocumentAnalysisCommand = new StartDocumentAnalysisCommand({
        DocumentLocation: {
            S3Object: {
                Bucket: bucketName,
                Name: fileKey,
            },
        },
        FeatureTypes: ["TABLES"],
    });

    const startTextDetectionResponse = await textractClient.send(startDocumentTextDetectionCommand);
    const startDocumentAnalysisResponse = await textractClient.send(startDocumentAnalysisCommand);

    if (!startTextDetectionResponse.JobId || !startDocumentAnalysisResponse.JobId) {
        throw new Error("Failed to start document text detection job.");
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

    if (documentAnalysisResult.Blocks) {
        extractedText += "\n\n" + processBlocks(documentAnalysisResult.Blocks);
    }

    return extractedText;
}

async function tryTextract(command: GetDocumentTextDetectionCommand | GetDocumentAnalysisCommand): Promise<any> {
    const maxRetries = 5;
    let retries = 0;
    while (retries < maxRetries) {
        const response = await textractClient.send(command);
        if (response.JobStatus === "SUCCEEDED" || response.JobStatus === "FAILED") {
            return response;
        } else if (response.JobStatus === "PARTIAL_SUCCESS") {
            await new Promise((resolve) => setTimeout(resolve, 5000)); 
            retries++;
        }
    }
    throw new Error("Text detection job failed");
}

const processBlocks = (blocks: Block[]): string => {
    if (!blocks || blocks.length === 0) {
        return "";
    }

    const lineBlocks = blocks
        .filter((block) => block.BlockType === "LINE")
        .map((block) => block.Text?.trim())
        .filter((text) => text && text.length > 0);

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

            return Object.values(rows)
                .map(row =>
                    row
                        .sort((a, b) => a.ColumnIndex - b.ColumnIndex)
                        .map(cell => cell.Text?.trim() || "")
                        .filter((text) => text.length > 0)
                        .join(" | ")
                )
                .filter((row) => row.length > 0)
                .join("\n");
        })
        .filter((text) => text.length > 0);

    return [...lineBlocks, ...tableBlocks].join("\n\n");
}
