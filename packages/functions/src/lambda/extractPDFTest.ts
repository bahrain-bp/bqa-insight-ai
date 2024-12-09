import { JsonFileLogDriver } from "aws-cdk-lib/aws-ecs";
import * as AWS from "aws-sdk";
import pdfParse from "pdf-parse"; // Import pdf-parse for text extraction

const s3 = new AWS.S3();


export async function handler(event: any) {
    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const fileKey = record.s3.object.key;

        console.log(`Processing file from bucket: ${bucketName}, key: ${fileKey}`);

        try {
            // Get the file URL directly from S3
            const fileURL = `https://${bucketName}.s3.amazonaws.com/${fileKey}`;

            // Fetch the file from the URL using crawler-request
            const pdfData = await crawlerRequest(fileURL);

            if (!pdfData) {
                console.error(`Error fetching PDF from URL: ${fileURL}`);
                continue;
            }

            // Extract information from the PDF using pdf-parse
            const extractedInfo = await extractPDFInfo(pdfData);
            console.log(`Extracted PDF Information:`, extractedInfo);

           
            
            // const extractReportMetadataHandler = new AWS.("extractReportMetadataHandler", {
            //     handler: "packages/functions/src/bedrock/invokeExpressLambda.invokeExpressLambda",
            //     timeout: "60 seconds",
            //     permissions: [
            //         bucket, "bedrock"
            //     ],
            // });

        } catch (error) {
            console.error(`Error processing file ${fileKey}:`, error);
        }
    }
}

// Function to fetch the PDF using crawler-request
function crawlerRequest(url: string): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
        crawler(url, (error: any, response: any, body: Buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

// Function to extract text and other information from the PDF using pdf-parse
async function extractPDFInfo(buffer: Buffer): Promise<any> {
    try {
        const data = await pdfParse(buffer); // Parse the PDF buffer
        
        const extractedInfo = {
            text: data.text,             // Extracted text content
            numPages: data.numpages,     // Number of pages in the PDF
            info: data.info,             // PDF info (author, title, etc.)
            metadata: data.metadata,     // PDF metadata (if available)
            version: data.version        // PDF.js version used
        };

        return extractedInfo; // Return the extracted PDF information
    } catch (error) {
        console.error("Error extracting information from PDF:", error);
        throw new Error("Failed to extract PDF information");
    }
}
function crawler(url: string, arg1: (error: any, response: any, body: Buffer) => void) {
    throw new Error("Function not implemented.");
}

