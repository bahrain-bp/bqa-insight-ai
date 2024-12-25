import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { generateJson } from "./generatejson";

type PromptType = 'analyze' | 'compare' | 'school' | 'general';

interface PromptTemplates {
  analyze: string;
  compare: string;
  school: string;
  general: string;
}

const promptTemplates: PromptTemplates = {
  analyze: `Goal: To analyze improvements and declines in educational institutes in Bahrain.
           Question: What is the analysis for ${''} in terms of improvements and declines?`,
  
  compare: `Goal: To compare performance between educational institutes.
           Question: What is the comparison between ${'institutes'}?`,
  
  school: `Goal: To get detailed information about a specific school.
          Question: What is the performance of ${''} school?`,
  
  general: `Goal: To understand general educational trends in Bahrain.
           Question: ${''}`
};

const determinePromptType = (prompt: string): PromptType => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('compare') || lowerPrompt.includes('versus') || lowerPrompt.includes('vs')) {
    return 'compare';
  }
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('analysis')) {
    return 'analyze';
  }
  if (lowerPrompt.includes('school') || lowerPrompt.includes('institute')) {
    return 'school';
  }
  return 'general';
};

const generatePrompt = (type: PromptType, params: any): string => {
  let template = promptTemplates[type];
  
  switch (type) {
    case 'analyze':
      return template.replace('{}', params.instituteName || '');
    case 'compare':
      return template.replace('institutes', params.institutions?.join(' and ') || '');
    case 'school':
      return template.replace('{}', params.instituteName || '');
    default:
      return template.replace('{}', params.question || '');
  }
};

export const invokeBedrockAgent = async (event: APIGatewayEvent) => {
  const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });
  

  async function invokeWithRetry(command: InvokeAgentCommand, maxRetries: number = 3): Promise<any> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await client.send(command);
        } catch (error) {
          if (error instanceof Error) {
              console.error("Error:", error.message);
              return {
                  statusCode: 500,
                  body: JSON.stringify({ error: error.message })
              };
          } else {
              console.error("Unexpected error:", error);
              return {
                  statusCode: 500,
                  body: JSON.stringify({ error: "An unexpected error occurred" })
              };
          }
      }
    }  

  }





  try {
    const filterParams = JSON.parse(event.body || "{}");
    console.log(filterParams, ": is prompt");
    
    if (!filterParams) {
      throw new Error('Parameters not provided');
    }

    const promptType = determinePromptType(filterParams.question || '');
    const finalPrompt = generatePrompt(promptType, filterParams);

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

    // const generatedJson = generateJson(completion);
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
      //body: JSON.stringify({ error: error.message })
    };
  }
};
