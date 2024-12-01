import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayEvent } from "aws-lambda";
import AWS from "aws-sdk";
import * as pdfjsLib from 'pdfjs-dist';

const s3 = new AWS.S3();
export const invokeExpressLambda = async (event: APIGatewayEvent) =>{
    const client = new BedrockRuntimeClient({ region: "us-east-1" });
    const modelId = "amazon.titan-text-express-v1"

    const bucketName = "hasan-insight-ai-s3stack-reportbucket6b54e113-r9qakwpuqpkr";
    const fileName = "Files/20ff198a-b7a7-4f72-9bbd-ad8334769c70";

    const params = {
        Bucket: bucketName,
        Key: fileName,
    };
    const s3Object = await s3.getObject(params).promise();
    const pdfBuffer = s3Object.Body;

    let arrayBuffer: ArrayBuffer;

    // Handle different types of Body
    if (typeof pdfBuffer === "string") {
      // Body is a string, convert it to Uint8Array first
      const uint8Array = new TextEncoder().encode(pdfBuffer);
      // Then convert Uint8Array to ArrayBuffer
      arrayBuffer = uint8Array.buffer;
    } else if (pdfBuffer instanceof Uint8Array) {
      // Body is already a Uint8Array
      arrayBuffer = pdfBuffer.buffer;
    } else if (pdfBuffer instanceof Blob) {
      // Body is a Blob, convert it to ArrayBuffer
      arrayBuffer = await pdfBuffer.arrayBuffer();
    } else {
      throw new Error("Unsupported type of Body");
    }

    const pdfjs = pdfjsLib.getDocument({data:arrayBuffer});

    // Load PDF document
    //const pdfDoc = await PDFDocument.load(arrayBuffer);
    console.log("pdfjs",pdfjs);


    // // const pdfData = await pdfParse(pdfBuffer);
    // const extractedText = pdfData.text;

    // console.log("extractedText", extractedText);
    console.log("pdf buffer", pdfBuffer);
    const input = {
        inputText: "hello",
    }
    const command = new InvokeModelCommand({
        contentType: "application/json",
        body : JSON.stringify(input),
        modelId,
    });
    const response = await client.send(command);
 
    const decodedResponseBody = new TextDecoder().decode(response.body);
    const responseBody = JSON.parse(decodedResponseBody);
    return responseBody.results[0].outputText;

}
