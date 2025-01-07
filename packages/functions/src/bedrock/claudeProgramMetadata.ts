import * as AWS from "aws-sdk"; // Importing necessary AWS SDK modules and Bedrock Client
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";
import { handleDynamoDbInsert } from "src/lambda/fillingJson";
import {jsonParse} from "./jsonParse";

// Initializing AWS services and Bedrock client
const dynamoDb = new DynamoDB.DocumentClient(); // DynamoDB client for reading and writing data
const client = new BedrockRuntimeClient({ region: "us-east-1" }); // Bedrock client for model inference
const sqs = new AWS.SQS(); // SQS client for interacting with Amazon SQS
const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0"; // Model ID for the Claude model in Bedrock
const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL; // SQS queue URL from environment variables

// Lambda handler function triggered by SQS events
export async function handler(event: SQSEvent) {
     // Loop through each message in the SQS event
    for (const record of event.Records) {
        try {
            let sqsEvent;
             // Parse the SQS message body
            try {
                sqsEvent = JSON.parse(record.body); // Parse the SQS message body
            } catch (error) {
                console.error("Error parsing SQS message:", record.body, error);
                continue; // Skip to the next record if parsing fails
            }

            // Destructure `text` and `fileKey` from the parsed SQS message
            const { text, fileKey } = sqsEvent;

            if (!text || !fileKey) {
                console.error("Invalid message content: missing 'text' or 'fileKey'");
                continue;
            }

            //Prompt for the Claude model to extract metadata about programmes within universities
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
            `;

             // Configuration for additional tools to be used by Claude model
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
                                                    "University Name": { "type": "string", "description": "The extracted entity name." },
                                                    "Programme Name": { "type": "string", "description": "The name of the programme." },
                                                    "Programme Judgment": { "type": "string", "description": "The final judgment of the programme" },
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
            };

             // Constructing the input payload for Bedrock model inference
            const input = {
                modelId: ModelId,
                messages: [{
                    role: "user",
                    content: [{
                        text: prompt,
                    }]
                }],
                inferenceConfig: { // Configuration for model inference
                    maxTokens: Number(2000), // Maximum tokens to generate
                    temperature: Number(1), // Sampling temperature for randomness
                    topP: Number(0.999), // Top-p sampling for token selection
                    topK: Number(250), // Top-k sampling for token selection
                },
                toolConfig: toolConfig
            };

            // Sending the inference request to the Claude model
            //@ts-ignore
            const command = new ConverseCommand(input);
            const response = await client.send(command);

             // Extracting the response content 
            const modelResponse = response.output?.message?.content?.[0].text
            console.log("model output: ", modelResponse);
        
            // Parse the structured JSON response
            const parsedResponse = jsonParse(modelResponse || "");
            console.log("Model parsed output: ", parsedResponse);

             // Save extracted metadata to DynamoDB and S3
            await insertProgramMetadata(parsedResponse, fileKey);
            console.log("IT SHOULD BE INSERTED TO PROGRAM METADATA TABLE");

            await insertReportMetadata(parsedResponse, fileKey);
            console.log("IT SHOULD BE INSERTED to fileMetaData");

            return parsedResponse;

        } catch (error) {
            await deleteSQSMessage(record.receiptHandle);
            console.error("Error processing SQS message:", error);
        }
    }
}

//Function to insert Program metadata into DynamoDB
async function insertProgramMetadata(data: any, fileKey: string) {
    const params = {
        TableName: process.env.PROGRAM_METADATA_TABLE_NAME as string,
        Item: {
            universityName: data["University Name"],
            programmeName: data["Programme Name"],
            programmeJudgment: data["Programme Judgment"]
        },
    };
    await dynamoDb.put(params).promise();
    await handleDynamoDbInsert(data, process.env.BUCKET_NAME || "", fileKey, 'program'); // Add this line here
    return;
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
// function to insert the university name in the filemetadata table to have a link between the university and program 
async function insertReportMetadata(data :any, fileKey : string) {
  const params = {
      TableName: process.env.FILE_METADATA_TABLE_NAME as string,
          Key : {fileKey},
          UpdateExpression: "SET universityName = :universityName",
          ExpressionAttributeValues: {
              ":universityName": data["University Name"],
          },
          ReturnValues: "UPDATED_NEW",
  };
  return await dynamoDb.update(params).promise();
}
