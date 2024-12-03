import { extractTextFromPDF } from "src/textract";
import { InvokeModelCommand, BedrockRuntimeClient, InvokeModelRequest } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({region: "us-east-1"});
export const extractReportMetadata = async (event: any) =>{

    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const fileKey = record.s3.object.key;

        console.log(`Processing file from bucket: ${bucketName}, key: ${fileKey}`);
        const payload = {bucketName : bucketName, objectKey: fileKey};

        const textractData = await extractTextFromPDF(payload);
    //    console.log("TEXTRACT DATA: ", textractData);

       const {text} = JSON.parse(textractData.body || "{}");
        console.log("formatted textract: ", text)
        const ModelId = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1";

        const input = {
            inputText : "Given the following text, give me the school name and give me the review cycle year. Give it in csv format and csv format only. Exlude the word Education and Training Quality Authority: "+text,
        }
        

        const command = new InvokeModelCommand({
            body : JSON.stringify(input),
            modelId : ModelId,
        });
       
        const response = await client.send(command);
        console.log("RESPONSE: ", response)

const decodedResponse = new TextDecoder().decode(response.body);
const decodedResponseBody = JSON.parse(decodedResponse);
const output = decodedResponseBody.results[0].outputText;
console.log("Final output: ",output)
return output;

        // try {
        //     // Get the file URL directly from S3
        //     const fileURL = `https://${bucketName}.s3.amazonaws.com/${fileKey}`;

        //     // Fetch the file from the URL using crawler-request
        //     const pdfData = await crawlerRequest(fileURL);

        //     if (!pdfData) {
        //         console.error(`Error fetching PDF from URL: ${fileURL}`);
        //         continue;
        //     }

        //     // Extract information from the PDF using pdf-parse
        //     // const extractedInfo = await extractPDFInfo(pdfData);
        //     // console.log(`Extracted PDF Information:`, extractedInfo);

           
            
        //     // const extractReportMetadataHandler = new AWS.("extractReportMetadataHandler", {
        //     //     handler: "packages/functions/src/bedrock/invokeExpressLambda.invokeExpressLambda",
        //     //     timeout: "60 seconds",
        //     //     permissions: [
        //     //         bucket, "bedrock"
        //     //     ],
        //     // });

        // } catch (error) {
        //     console.error(`Error processing file ${fileKey}:`, error);
        // }
    }

}
// Function to fetch the PDF using crawler-request
// function crawlerRequest(url: string): Promise<Buffer | null> {
//     return new Promise((resolve, reject) => {
//         crawler(url, (error: any, response: any, body: Buffer) => {
//             if (error) {
//                 reject(error);
//             } else {
//                 resolve(body);
//             }
//         });
//     });
// }

// // Function to extract text and other information from the PDF using pdf-parse
// async function extractPDFInfo(buffer: Buffer): Promise<any> {
//     try {
//         const data = await pdfParse(buffer); // Parse the PDF buffer
        
//         const extractedInfo = {
//             text: data.text,             // Extracted text content
//             numPages: data.numpages,     // Number of pages in the PDF
//             info: data.info,             // PDF info (author, title, etc.)
//             metadata: data.metadata,     // PDF metadata (if available)
//             version: data.version        // PDF.js version used
//         };

//         return extractedInfo; // Return the extracted PDF information
//     } catch (error) {
//         console.error("Error extracting information from PDF:", error);
//         throw new Error("Failed to extract PDF information");
//     }
// }
function crawler(url: string, arg1: (error: any, response: any, body: Buffer) => void) {
    throw new Error("Function not implemented.");
}
