import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { generateJson } from "./generatejson";
import { createComparePrompt, createAnalyzePrompt } from './promptfilters';


type EducationLevel = 'school' | 'university';
type AnalysisType = 'analyze' | 'compare';

interface PromptParams {
  instituteName?: string;
  institutes?: string[];
  metric?: string;
  level: EducationLevel;
}

// Function to determine if the prompt is about universities or schools
function detectEducationLevel(prompt: string): EducationLevel {
  const lowerPrompt = prompt.toLowerCase();
  return lowerPrompt.includes('university') 
    ? 'university' 
    : 'school';
}




// Function to determine if we should analyze or compare
function detectAnalysisType(prompt: string): AnalysisType {
  const lowerPrompt = prompt.toLowerCase();
  return (lowerPrompt.includes('compare') || 
          lowerPrompt.includes('versus') || 
          lowerPrompt.includes('vs') || 
          lowerPrompt.includes('between')) 
    ? 'compare' 
    : 'analyze';
}

// Function to extract institute names
function extractInstitutes(prompt: string): string[] {
  const words = prompt.split(' ');
  const institutes: string[] = [];
  
  // Common indicators that the next word might be an institute name
  const indicators = ['at', 'in', 'for', 'between', 'and'];
  
  for (let i = 0; i < words.length; i++) {
    if (indicators.includes(words[i].toLowerCase())) {
      if (words[i + 1]) {
        // Check if next few words might be part of institute name
        let instituteName = words[i + 1];
        let j = i + 2;
        while (j < words.length && 
               !indicators.includes(words[j].toLowerCase()) && 
               words[j].length > 1) {
          instituteName += ' ' + words[j];
          j++;
        }
        institutes.push(instituteName);
      }
    }
  }
  
  return institutes;
}


// Function to extract metric (if any)
function extractMetric(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  const metrics = [
    'performance',
    'improvement',
    'academic achievement',
    'teaching quality',
    'student development',
    'leadership',
    'governance'
  ];
  
  for (const metric of metrics) {
    if (lowerPrompt.includes(metric)) {
      return metric;
    }
  }
  
  return 'performance'; // default metric
}



// Main function to analyze prompt and generate appropriate response
export function generatePrompt(userPrompt: string): string {
  // Detect education level
  const level = detectEducationLevel(userPrompt);
  
  // Detect analysis type
  const analysisType = detectAnalysisType(userPrompt);
  
  // Extract institutes
  const institutes = extractInstitutes(userPrompt);
  
  // Extract metric
  const metric = extractMetric(userPrompt);

  // Generate appropriate prompt based on type
  if (analysisType === 'compare') {
    return createComparePrompt(
      institutes.join(' and '),
      metric,
      false // governorate parameter
    );
  } else {
    return createAnalyzePrompt(
      institutes[0] || '',
      metric
    );
  }
}


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

        // Generate the appropriate prompt
        const finalPrompt = generatePrompt(filterParams.question || '');

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

    const generatedJson = generateJson(completion);


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