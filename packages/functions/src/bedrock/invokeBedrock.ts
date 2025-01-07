import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { processPrompt } from './promptProcessor';

export const invokeBedrockAgent = async (event: APIGatewayEvent) => {
    // Create an instance of the BedrockAgentRuntimeClient for communication
  const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

  try {
 // Parse the input parameters from the request body
    const filterParams = JSON.parse(event.body || "{}");
    console.log(filterParams, ": is prompt");
   // Ensure input parameters are provided; otherwise, throw an error
    if (!filterParams) {
      throw new Error('Parameters not provided');
    }

    // Generate the appropriate prompt based on the input
    const finalPrompt = processPrompt(filterParams);

  // Prepare the command to invoke the Bedrock agent
    const command = new InvokeAgentCommand({
      agentId: process.env.AGENT_ID,
      agentAliasId: process.env.AGENT_ALIAS_ID,
      sessionId: "123",// Example session ID, can be replaced with dynamic value if needed
      inputText: finalPrompt
    });

    // Variable to store the final response text
    let completion = "";
    const response = await client.send(command);// Send the command to Bedrock Agent

    if (!response.completion) {
      throw new Error("Completion is undefined");
    }
   // Process the response in chunks (streaming response)
    for await (const chunkEvent of response.completion) {
      if (chunkEvent.chunk?.bytes) {
     // Decode each chunk of response text and append it to the completion
        const decodedChunk = new TextDecoder("utf-8").decode(chunkEvent.chunk.bytes);
        completion += decodedChunk;
      }
    }

    if (!completion) {
      throw new Error("No response received");
    }
    // Return a successful response with the generated output from Bedrock
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Received Output from Bedrock',
        response: completion
      }),
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};