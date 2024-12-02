import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";
import AWS from "aws-sdk";
import { extractTextFromPDF } from "src/lambda/textract";

const s3 = new AWS.S3();
export const invokeExpressLambda = async (event: APIGatewayEvent) =>{
    const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });
    const agentId = process.env.AGENT_ID;
    const agentAliasId = process.env.AGENT_ALIAS_ID;
    const sessionId = "123";

    const bucketName = "maryamaleskafi-insight-ai-s3s-reportbucket6b54e113-zoyhomcbjh6w";
    const fileName = "Files/7183fc99-5416-4f03-bfe0-06d844c62cbe";

    const extractedData = await extractTextFromPDF(bucketName,fileName);
    
    const command = new InvokeAgentCommand({
        agentId,
        agentAliasId,
        sessionId,
        inputText : "hello ",
       
    });
   
 
    
    try {
        let completion = "";
        const response = await client.send(command);
  
        if (response.completion === undefined) {
          throw new Error("Completion is undefined");
        }
  
        // Check for chunk events by iterating through the AsyncIterable
        let hasChunks = false;
        let decodedResponse = "";
        for await (const chunkEvent of response.completion) {
          const chunk = chunkEvent.chunk;
  
          // Ensure chunk is defined before proceeding
          if (chunk !== undefined && chunk.bytes) {
            hasChunks = true;
            decodedResponse += new TextDecoder("utf-8").decode(chunk.bytes);
            completion += decodedResponse;
          } else {
            console.warn("Received an empty chunk or chunk with no bytes");
          }
        }
  
        if (!hasChunks) {
          throw new Error("No chunks received in the response");
        }
  
        //console.log("result is: ", typeof decodedResponse)
        console.log("extracted data:", extractedData)
      console.log("decoded response", decodedResponse)
  
        //const result = JSON.parse(decodedResponse) || "";
       /// console.log("result is now: " + result)
    
  
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Received Output from Bedrock",
            response: decodedResponse, // Return the cleaned result here
          }),
        };
      } catch (err) {
        console.error("Error invoking Bedrock agent:", err);
        return {
          statusCode: 500,
         // body: JSON.stringify({ message: "Error invoking Bedrock agent", error: err.message }),
        };
      }
 


}
