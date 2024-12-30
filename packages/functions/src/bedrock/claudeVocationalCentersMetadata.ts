import * as AWS from "aws-sdk";
import { InvokeModelCommand, BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";
import { handleDynamoDbInsert } from "src/lambda/fillingJson";

const dynamoDb = new DynamoDB.DocumentClient();
const client = new BedrockRuntimeClient({ region: "us-east-1" });
const sqs = new AWS.SQS();
const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0";
const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL;

// Using Llama model to extract metadata about programs
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
                "Vocational Centre Name": "Agora Training Centre",
                "Vocational Centre Location": "Manama",
                "Programme Judgment": "08-12 October 2023",
              }
              </formatting_example>
            `;
            console.log(text);
            

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
                                  "Vocational Training center name": {"type": "string", "description": "The extracted entity name."},
                                //   "University Location": {"type": "string", "description": "The entity type (LOCATION)."},
                                //   "Number Of Qualifications": {"type": "number", "description": "Total number of qualifications"},
                                //   "Number of Programmes": {"type": "number", "description": "Number of programmes offered by the university including (Bachelor Degree, Master Degree, PhD Degress)"}
                                  // "context": {"type": "string", "description": "The context in which the entity appears in the text."}
                                },
                                "required": ["Vocational Training center name"]
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

            // const toolConfig = {
            //     "tools": [
            //         {
            //             "toolSpec": {
            //                 "name": "print_entities",
            //                 "description": "Prints extract named entities.",
            //                 "inputSchema": {
            //                     "json": {
            //                         "type": "object",
            //                         "properties": {
            //                             "entities": {
            //                                 "type": "array",
            //                                 "items": {
            //                                     "type": "object",
            //                                     "properties": {
            //                                         "Vocational Centre Name": { "type": "string", "description": "The extracted Provider Name." },
            //                                         // "Vocational Centre Location": { "type": "string", "description": "The location of the Vocational Training Centre in Kingdom of Bahrain." },
            //                                         // "Date Of Review": { "type": "string", "description": "The Date Reviewed" },
            //                                     },
            //                                     "required": ["Vocational Centre Name"]
            //                                 }
            //                             }
            //                         },
            //                         "required": ["entities"]
            //                     }
            //                 }
            //             }
            //         }
            //     ]
            // };

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
            // console.log("model output: ", modelResponse);

            // const afterRegex = regexFunction(modelResponse || "");
    
            // const parsedResponse = JSON.parse(afterRegex || "");
            console.log("model output: ", response.output?.message?.content?.[0]);

            
            // await insertVocationalCentreMetadata(parsedResponse, fileKey);
            console.log("IT SHOULD BE INSERTED TO VOCATIONAL CENTRE METADATA TABLE");

            // return parsedResponse;

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

// Insert Program metadata into DynamoDB and S3
async function insertVocationalCentreMetadata(data: any, fileKey: string) {
    const params = {
        TableName: process.env.PROGRAM_METADATA_TABLE_NAME as string,
        Item: {
            vocationalCenterName: data["Vocational Centre Name"],
            vocationalCenterLocation: data["Vocational Centre Location"],
            dateOfReview: data["Date Of Review"]
        },
    };
    await dynamoDb.put(params).promise();
    await handleDynamoDbInsert(data, process.env.BUCKET_NAME || "", fileKey, 'program'); // Add this line here
    return;
}

function regexFunction(input: string): string {
    
  // extract JSON  part incase there is text also
  const jsonRegex = /{([\s\S]*?)}/;
  const extractedJson = input.match(jsonRegex);

  if (!extractedJson) {
      throw new Error("No JSON-like structure found in the input.");
  }

  return extractedJson[0];

}