
import {
    BedrockAgentRuntimeClient,
    InvokeAgentCommand,
  } from "@aws-sdk/client-bedrock-agent-runtime";
  
  /**
   * @typedef {Object} ResponseBody
   * @property {string} completion
   */
  
  /**
   * Invokes a Bedrock agent to run an inference using the input
   * provided in the request body.
   *
   * @param {string} prompt - The prompt that you want the Agent to complete.
   * @param {string} sessionId - An arbitrary identifier for the session.
   */
  export const invokeBedrockAgent = async (prompt:string, sessionId:string) => {
    const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });
    // const client = new BedrockAgentRuntimeClient({
    //   region: "us-east-1",
    //   credentials: {
    //     accessKeyId: "accessKeyId", // permission to invoke agent
    //     secretAccessKey: "accessKeySecret",
    //   },
    // });
  
    const agentId = process.env.AGENT_ID;
    const agentAliasId = process.env.AGENTALIASID;
  
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
        for await (const chunkEvent of response.completion) {
          const chunk = chunkEvent.chunk;
          
          // Ensure chunk is defined before proceeding
          if (chunk !== undefined && chunk.bytes) {
            hasChunks = true;
            console.log(chunk);
            const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
            completion += decodedResponse;
          } else {
            console.warn("Received an empty chunk or chunk with no bytes");
          }
        }
    
        if (!hasChunks) {
          throw new Error("No chunks received in the response");
        }
    
        return { sessionId: sessionId, completion };
      } catch (err) {
        console.error("Error invoking Bedrock agent:", err);
        return undefined;
      }
    };
  
  // Call function if run directly
  import { fileURLToPath } from "node:url";
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const result = await invokeBedrockAgent("I need help.", "123");
    console.log(result);
  }
  
  