
import {
    BedrockAgentRuntimeClient,
    InvokeAgentCommand,
  } from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";

  export const invokeBedrockAgent = async (event: APIGatewayEvent) => {
    const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });
  
    const agentId = process.env.AGENT_ID;
    const agentAliasId = process.env.AGENT_ALIAS_ID;
    const sessionId = "123";

    try {
      const { prompt } = JSON.parse(event.body || "{}");
  
      if (!prompt) {
        throw new Error('Text not provided');
      }
  
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      inputText: prompt,
    });
  
    try {
        let completion = "";
        const response = await client.send(command);
    
        if (response.completion === undefined) {
          throw new Error("Completion is undefined");
        }
    
        // Check for chunk events by iterating through the AsyncIterable
        let hasChunks = false;
        var decodedResponse = ""
        for await (const chunkEvent of response.completion) {
          const chunk = chunkEvent.chunk;
          
          // Ensure chunk is defined before proceeding
          if (chunk !== undefined && chunk.bytes) {
            hasChunks = true;
            // console.log(chunk);
            decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
            completion += decodedResponse;
          } else {
            console.warn("Received an empty chunk or chunk with no bytes");
          }
        }
    
        if (!hasChunks) {
          throw new Error("No chunks received in the response");
        }
        
        // console.log("Decoded response: ", JSON.parse(decodedResponse).result)

        return {
          statusCode: 200,
          body: JSON.stringify({
             message: 'Received Output from Bedrock',
             response: JSON.parse(decodedResponse).result
            }),
        };
      } catch (err) {
        console.error("Error invoking Bedrock agent:", err);
        return undefined;
      }
    } catch (error) {
      console.log(error);
    }};