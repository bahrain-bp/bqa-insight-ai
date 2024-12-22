import * as AWS from "aws-sdk";
import { InvokeModelCommand, BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";

const dynamoDb = new DynamoDB.DocumentClient();
const client = new BedrockRuntimeClient({region: "us-east-1"});
const sqs = new AWS.SQS();
const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0";
const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL;

//Using Llama model to extract metadata about reports and institutes
export async function handler(event: SQSEvent){
    for (const record of event.Records) {
        try {
            let sqsEvent;
            try {
                sqsEvent = JSON.parse(record.body); // Parse the SQS message body
            } catch (error) {
                console.error("Error parsing SQS message:", record.body, error);
                continue;
            }
            
            // Destructure `text` and `fileKey` from the parsed SQS message
            const { text, fileKey } = sqsEvent;
            
            if (!text || !fileKey) {
                console.error("Invalid message content: missing 'text' or 'fileKey'");
                continue;
            }
            
                const prompt = 
                `
                  Your goal is to extract structured information from the user's input that matches the form described below.
                  Use this data for your report: <data>${text}</data>.

                  <instructions>
                    1. Ensure that the output is in JSON format.
                    2. Do not add any clarifying information.
                  </instructions>

                  Follow this structure:
                  <formatting_example>
                  {
                    "University Name": "Bahrain Polytechnic",
                   "Programme Name": "Information Technology",
                   "Programme Judgment": "Satisfies",
                  }
                  </formatting_example>
                `

                

                const toolConfig = {
                  "tools": [
                    {
                      "toolSpec": {
                        "name": "print_entities",
                        "description": "Prints extract named entities.",
                        "inputSchema": {
                          "json": {
                            "type": "object",
                            "properties": {
                              "entities": {
                                "type": "array",
                                "items": {
                                  "type": "object",
                                  "properties": {
                                    "University Name": {"type": "string", "description": "The extracted entity name."},
                                    "Programme Name": {"type": "string", "description": "The name of the programme."},
                                    "Programme Judgment": {"type": "string", "description": "The final judgment of the programme"},
                                    // "context": {"type": "string", "description": "The context in which the entity appears in the text."}
                                  },
                                  "required": ["University Name", "Programme Name", "Programme Judgment"]
                                }
                              }
                            },
                            "required": ["entities"]
                          }
                        }
                      }
                    }
                  ]
                }
                
                const input = {
                  modelId: ModelId,
                  messages: [{
                    role: "user",
                    content: [{
                      text: prompt,
                    }]
                  }],
                  inferenceConfig: { // InferenceConfiguration
                    maxTokens: Number(2000),
                    temperature: Number(1),
                    topP: Number(0.999),
                    topK: Number(250),
                  },
                  toolConfig: toolConfig
                 
                };

            //@ts-ignore
            const command = new ConverseCommand(input);
            
            const response = await client.send(command);
            console.log("HERE IS RESPONSE: ", response);
    
            const modelResponse = response.output?.message?.content?.[0].text
            const parsedResponse = JSON.parse(modelResponse || "");
            console.log("model output: ", modelResponse);
           // const extractedOutput = parseMetadata(parsedResponse);
            await insertProgramMetadata(parsedResponse);
            console.log("IT SHOULD BE INSERTED TO PROGRAM METADATA TABLE")
         
            return parsedResponse;

        } catch (error) {
            await deleteSQSMessage(record.receiptHandle);
            console.error("Error processing SQS message:", error);
        }
    } 
}


// Function to delete an SQS message after processing
async function deleteSQSMessage(receiptHandle: string): Promise<void> {
  if (!extractMetadataQueueUrl) {
    console.error("Extract metadata queue URL is not available in the environment.");
    return;
  }

  const deleteParams = {
    QueueUrl: extractMetadataQueueUrl,
    ReceiptHandle: receiptHandle,
  };

  try {
    await sqs.deleteMessage(deleteParams).promise();
    console.log("SQS message deleted successfully.");
  } catch (error) {
    console.error("Error deleting SQS message:", error);
  }
}

// Insert file metadata into DynamoDB
async function insertProgramMetadata(data :any) {
   
    const params = {
        TableName: process.env.PROGRAM_METADATA_TABLE_NAME as string,
        Item: {
          universityName: data["University Name"],
          programmeName: data["Programme Name"],
          programmeJudgment: data["Programme Judgment"]
          },
           
    };
    return await dynamoDb.put(params).promise();
}






//   // Learn more about the Llama 3 prompt format at:
//   // https://llama.meta.com/docs/model-cards-and-prompt-formats/meta-llama-3/#special-tokens-used-with-meta-llama-3
  
  