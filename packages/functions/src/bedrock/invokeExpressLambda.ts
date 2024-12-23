import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import {BedrockRuntimeClient, ConverseCommand, ConverseCommandInput, ConverseRequest, DocumentBlock} from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { ConversationRole } from "@aws-sdk/client-bedrock-runtime";

import AWS from "aws-sdk";
import { extractTextFromPDF } from "src/lambda/textract";

const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
export const invokeExpressLambda = async (event: APIGatewayEvent) =>{
    



    console.log("invoking split lambda");
    const extractPDFTest = await lambda.invoke({
        FunctionName: "arn:aws:lambda:us-east-1:588738578192:function:sayed-insight-ai-S3Stack-SplitPDFHandler5175DB9F-WZmcjGgfaZvV", // ARN or name of the second function
        InvocationType: "Event", // Fire-and-forget
       // Payload: JSON.stringify(bedrockEvent), // Pass event data or a subset of it
    }).promise();

    console.log("extractPDFTest ", extractPDFTest)
    
    // const bedrockEvent = {
    //     pdfData : pdfData
    // }

    // const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });
    const {pdfData} = JSON.parse(event.body || "{}"); 
    const client = new BedrockRuntimeClient({ region: "us-east-1" });
    console.log("event is: ",event)
    // const agentId = process.env.AGENT_ID;
    // const agentAliasId = process.env.AGENT_ALIAS_ID;
    const sessionId = "123";

    const bucketName = "maryamaleskafi-insight-ai-s3s-reportbucket6b54e113-zoyhomcbjh6w";
    const fileName = "Files/7183fc99-5416-4f03-bfe0-06d844c62cbe";

    // const extractedData = await extractTextFromPDF(bucketName,fileName);
    
    // const command = new InvokeAgentCommand({
    //     agentId,
    //     agentAliasId,
    //     sessionId,
    //     inputText : "Given the following text, give me the school name and review year: " + "the following report is about some schools including 'alsehla sprimary boys school',. the report is conducted on 2019. the followin report will help us to understand how the school performs.",
    // });
   
 
    
    // try {
    //     let completion = "";
    //     const response = await client.send(command);
  
    //     if (response.completion === undefined) {
    //       throw new Error("Completion is undefined");
    //     }
  
    //     // Check for chunk events by iterating through the AsyncIterable
    //     let hasChunks = false;
    //     let decodedResponse = "";
    //     for await (const chunkEvent of response.completion) {
    //       const chunk = chunkEvent.chunk;
  
    //       // Ensure chunk is defined before proceeding
    //       if (chunk !== undefined && chunk.bytes) {
    //         hasChunks = true;
    //         decodedResponse += new TextDecoder("utf-8").decode(chunk.bytes);
    //         completion += decodedResponse;
    //       } else {
    //         console.warn("Received an empty chunk or chunk with no bytes");
    //       }
    //     }
  
    //     if (!hasChunks) {
    //       throw new Error("No chunks received in the response");
    //     }
  
    //     //console.log("result is: ", typeof decodedResponse)
    //     console.log("extracted data:", extractedData)
    //   console.log("decoded response", decodedResponse)
  
    //     //const result = JSON.parse(decodedResponse) || "";
    //    /// console.log("result is now: " + result)
    
  
    //     return {
    //       statusCode: 200,
    //       body: JSON.stringify({
    //         message: "Received Output from Bedrock",
    //         response: decodedResponse, // Return the cleaned result here
    //       }),
    //     };
    //   } catch (err) {
    //     console.error("Error invoking Bedrock agent:", err);
    //     return {
    //       statusCode: 500,
    //      // body: JSON.stringify({ message: "Error invoking Bedrock agent", error: err.message }),
    //     };
    //   }

    // const document: DocumentBlock = {
    //   format: "pdf",
    //   name: "hello.pdf",
    //   source: {
    //     bytes: event.pdfData;
    //   }
    // }

    // const input: ConverseRequest = {
    //   modelId: "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1",
    //   messages: [
    //     {
    //       role: "user",
    //       content: [ // ContentBlocks // required
    //       { // ContentBlock Union: only one key present
    //         text: "STRING_VALUE",
    //         document: { // DocumentBlock
    //           format: "pdf",
    //           name: "STRING_VALUE", // required
    //           source: { // DocumentSource Union: only one key present
    //             bytes: new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")
    //           },
    //         },
    //     }
    
    //   ]
    // }

    const test = { // ConverseRequest
      modelId: "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1", // required
      messages: [ // Messages
        { // Message
          role: "user",
          content: [ // ContentBlocks // required
            { // ContentBlock Union: only one key present
              text: "Summarize this document for me",
              document: { // DocumentBlock
                format: "pdf",
                name: "hello", // required
                source: { // DocumentSource Union: only one key present
                  bytes: pdfData
                },
              },
            },
          ],
        },
      ],
    };
 
    // const command = new ConverseCommand(test);
    // const response = await client.send(command);
    
    // console.log(response.output?.message);
    // return {
    //   message: response.output?.message
    // }
    


}
