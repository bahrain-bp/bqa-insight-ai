import * as AWS from "aws-sdk"; // Importing necessary AWS SDK modules and Bedrock Client
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";
import { handleDynamoDbInsert } from "src/lambda/fillingJson";
import {jsonParse} from "./jsonParse";

const dynamoDb = new DynamoDB.DocumentClient(); // DynamoDB client for reading and writing data
const client = new BedrockRuntimeClient({ region: "us-east-1" }); // Bedrock client for model inference
const sqs = new AWS.SQS(); // SQS client for interacting with Amazon SQS
const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0"; // Model ID for the Claude-3 model in Bedrock
const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL; // SQS queue URL from environment variables

// Using Claude model to extract metadata about university reports
export async function handler(event: SQSEvent) {
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

      // Prompt for the Bedrock Claude model to extract structured metadata about university reports
      const prompt = `
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
          "University Location": "Isa Town - Southern Governorate",
          "Number of Programmes": 22,
          "Number of Qualifications": 22
        }
        </formatting_example>
      `;

      // Defining a tool configuration to assist the model
      const toolConfig = {
        tools: [
          {
            toolSpec: {
              name: "print_entities",
              description: "Prints extract named entities.",
              inputSchema: {
                json: {
                  type: "object",
                  properties: {
                    entities: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          "University Name": { type: "string", description: "The extracted entity name." },
                          "University Location": { type: "string", description: "The entity type (LOCATION)." },
                          "Number of Programmes": { type: "number", description: "Number Of programmes offered by the university including (Bachelor Degree, Master Degree, PhD Degree)" },
                          "Number of Qualificationss": { type: "number", description: "Total number of qualifications"  }
                        },
                        required: ["University Name", "University Location", "Number of Programmes", "Number of Qualifications"]
                      }
                    }
                  },
                  required: ["entities"]
                }
              }
            }
          }
        ]
      };

      // Constructing the input payload for Claude model inference
      const input = {
        modelId: ModelId,
        messages: [
          {
            role: "user",
            content: [
              {
                text: prompt
              }
            ]
          }
        ],
        inferenceConfig: {
          maxTokens: Number(2000), // Maximum tokens to generate
          temperature: Number(1), // Sampling temperature for randomness
          topP: Number(0.999), // Top-p sampling for token selection
          topK: Number(250) // Top-k sampling for token selection
        },
        toolConfig: toolConfig
      };

      // Sending the input to the Bedrock model using ConverseCommand
      //@ts-ignore
      const command = new ConverseCommand(input);
      const response = await client.send(command);

      // Extract the text content from the model's response
      const modelResponse = response.output?.message?.content?.[0].text;

      // Parse the extracted JSON content
      const parsedResponse = jsonParse(modelResponse || "");
      console.log("Model parsed output: ", parsedResponse);

      // Insert the extracted metadata into DynamoDB
      await insertUniversityMetadata(parsedResponse, fileKey);
      console.log("IT SHOULD BE INSERTED TO UNIVERSITY METADATA TABLE");

      await insertReportMetadata(parsedResponse, fileKey);
      console.log("IT SHOULD BE INSERTED to fileMetaData");

      return parsedResponse;
    } catch (error) {
      await deleteSQSMessage(record.receiptHandle);
      console.error("Error processing SQS message:", error);
    }
  }
}

// Function to insert university metadata into DynamoDB
async function insertUniversityMetadata(data: any, fileKey: string) {
  const params = {
    TableName: process.env.UNIVERSITY_METADATA_TABLE_NAME as string, // DynamoDB table name from environment variables
    Item: {
      universityName: data["University Name"], // Extracted university name
      location: data["University Location"], // Extracted location
      numOfPrograms: data["Number of Programmes"], // Extracted number of programmes
      numOfQualifications: data["Number of Qualifications"] // Extracted number of qualifications
    }
  };

  // Save the metadata to DynamoDB
  await dynamoDb.put(params).promise();
  await handleDynamoDbInsert(data, process.env.BUCKET_NAME || "", fileKey, "university");
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
    ReceiptHandle: receiptHandle
  };

  try {
    await sqs.deleteMessage(deleteParams).promise();
    console.log("SQS message deleted successfully.");
  } catch (error) {
    console.error("Error deleting SQS message:", error);
  }
}

// Insert file metadata into DynamoDB
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
