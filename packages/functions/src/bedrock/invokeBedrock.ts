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
      throw new Error("Text not provided");
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

      // Clean the result by removing % symbols from references
      const result = JSON.parse(decodedResponse).result || "";
      const cleanedResult = result.replace(/%\[(\d+)]%/g, "[$1]");

      // Log for debugging
      console.log("Cleaned result:", cleanedResult);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Received Output from Bedrock",
          response: cleanedResult, // Return the cleaned result here
        }),
      };
    } catch (err) {
      console.error("Error invoking Bedrock agent:", err);
      return {
        statusCode: 500,
      // body: JSON.stringify({ message: "Error invoking Bedrock agent", error: err.message }),
      };
    }
  } catch (error) {
    console.error("Error parsing input or processing request:", error);
    return {
      statusCode: 400,
      //body: JSON.stringify({ message: "Invalid request", error: error.message }),
    };
  }
};
