import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { processPrompt } from './promptProcessor';

export const invokeBedrockAgent = async (event: APIGatewayEvent) => {
  const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

  try {
    const filterParams = JSON.parse(event.body || "{}");
    console.log(filterParams, ": is prompt");
    
    if (!filterParams) {
      throw new Error('Parameters not provided');
    }

    // Generate the appropriate prompt based on the input
    const finalPrompt = processPrompt(filterParams);

    const command = new InvokeAgentCommand({
      agentId: process.env.AGENT_ID,
      agentAliasId: process.env.AGENT_ALIAS_ID,
      sessionId: "123",
      inputText: finalPrompt
    });

    let completion = "";
    const response = await client.send(command);

    if (!response.completion) {
      throw new Error("Completion is undefined");
    }

    for await (const chunkEvent of response.completion) {
      if (chunkEvent.chunk?.bytes) {
        const decodedChunk = new TextDecoder("utf-8").decode(chunkEvent.chunk.bytes);
        completion += decodedChunk;
      }
    }

    if (!completion) {
      throw new Error("No response received");
    }

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