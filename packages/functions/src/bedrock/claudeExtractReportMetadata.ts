import * as AWS from "aws-sdk"; // Importing necessary AWS SDK modules and Bedrock Client
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { handleDynamoDbInsert } from "src/lambda/fillingJson";
import { Topic } from "sst/node/topic";
import {jsonParse} from "./jsonParse";

// Initializing AWS services
const dynamoDb = new DynamoDB.DocumentClient(); // DynamoDB client for reading and writing data
const client = new BedrockRuntimeClient({ region: "us-east-1" }); // Bedrock client for model inference
const sqs = new AWS.SQS(); // SQS client for interacting with Amazon SQS
const snsClient = new SNSClient();
const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL;
const bucket = process.env.BUCKET_NAME || "";

// Using Claude model to extract metadata about reports and institutes
const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0"; // Model ID for the Claude model in Bedrock

// Main handler function to process SQS events
export async function handler(event: SQSEvent) {
  console.log(event, ": event");

  for (const record of event.Records) {
    try {
      let sqsEvent;
      try {
        // Parse the SQS message body
        sqsEvent = JSON.parse(record.body);
        console.log(sqsEvent, ": sqs event");
      } catch (error) {
        console.error("Error parsing SQS message:", record.body, error);
        continue;
      }

      // Destructure `text` and `fileKey` from the parsed SQS message
      const { text, fileKey } = sqsEvent;

      // Validate message content
      if (!text || !fileKey) {
        console.error("Invalid message content: missing 'text' or 'fileKey'");
        continue;
      }

      // Prompt for the Claude model to extract metadata about the uploaded schools' reports
      const prompt = `Your goal is to extract structured information from the user's input that matches the form described below.
                When extracting information please make sure it matches the type information exactly. Do not add any attributes that do not appear in the schema shown below. Include the columns in the response and Do no forget them.
                These are the columns, ensure that they are in the response, and enclose every field in double quotes (""):
                "Institute Name","Institute Classification","Date of Review","Overall Effectiveness","Location", "Grades In School"
                
                request: {
                Institute Name: String // The name of the institute excluding the word Education and Training Quality Authority.
                Institute Classification: String// Give me the institute classification is it Goverment School or Private School, only if you detect the word private it means private school, otherwise keep it as Government.
                Date of Review: String// The date of the review.
                Overall Effectiveness: String // The institute overall effectiveness is either 1 which means outsanding, if 2 means Good, if 3 means Satisfactory, if 4 means Inadequate.
                Location: String// The institute location ONLY including Governate, without town.
                Grades In School: String // The Grade level in school by checking the primary, middle, and high columns tell me is it Primary School, Secondary School, or High School excluding 'Grades e.g. 1 to 12'.
                }
    
                Please output the extracted information in JSON format. 
                Do not output anything except for the extracted information. Do not use the below input output examples as a response. Do not add any clarifying information. Do not add any fields that are not in the schema. If the text contains attributes that do not appear in the schema, please ignore them. All output must be in JSON format and follow the schema specified above. Wrap the JSON in tags.
    
                Input: AlRawabi Private School located in sehla Northern Governorate in Bahrain. It includes levels from 1-9. The school overall effectiveness is 3: Satisfactory according to the report date fo review on 30 April and 2-3 May 2018.
                Output: 
                {
                "Institute Name": "AlRawabi Private School",
                "Institute Classification": "Private",
                "Date of Review": "30 April and 2-3 May 2018",
                "Overall Effectiveness": "3: Satisfactory",
                "Location": "Northern Governorate",
                "Grades In School": "Secondary",
                }
    
                Input: Jidhafs Secondary Girls School located in Jidhafs Capital Governorate in Bahrain. It includes levels from 10-12. The school overall effectiveness is 3: Satisfactory according to the report date fo review on 30 April and 2-3 May 2018.
                Output:
                {
                "Institute Name": "Jidhafs Secondary Girls School",
                "Institute Classification": "Government School",
                "Date of Review": "30 April and 2-3 May 2018",
                "Overall Effectiveness": "3: Satisfactory",
                "School Location": "Capital Governorate",
                "Grades In School": "High School"
                }
    
    
                Input: ` + text + `
                Output: {
                "Institute Name": "",
                "Institute Classification": "",
                "Date of Review": "",
                "Overall Effectiveness": "",
                "Location": "",
                "Grades In School": ""
                }`;
                    
            
    
      // Payload for invoking the Claude model
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000, // Maximum tokens to generate
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
          },
        ],
      };

       // Using InvokeModelCommand to invoke the Claude model
       const command = new InvokeModelCommand({
        contentType: "application/json",
        body: JSON.stringify(payload),
        modelId: ModelId,
      });

      // Sending the command to Claude model
      const response = await client.send(command);
      const decodedResponse = new TextDecoder().decode(response.body);
      const decodedResponseBody = JSON.parse(decodedResponse);
      const output = decodedResponseBody.content[0].text;
      console.log("Final output: ", output);

      // Parse the extracted metadata
      const extractedOutput = jsonParse(output);
      console.log("Extracted Output:", extractedOutput);

      // Insert metadata into DynamoDB and handle S3 JSON insertion
      await insertInstituteMetadata(extractedOutput, fileKey);
      console.log("IT SHOULD BE INSERTED TO INSTITUTE METADATA");

      await insertReportMetadata(extractedOutput, fileKey);
      console.log("IT SHOULD BE INSERTED to fileMetaData");

      // Delete the processed SQS message
      await deleteSQSMessage(record.receiptHandle);
      return extractedOutput;



        } catch (error) {
            await deleteSQSMessage(record.receiptHandle);
            console.error("Error processing SQS message:", error);
        }
    } 
}

// Function to insert the extracted institute metadata into the DynamoDB table
async function insertInstituteMetadata(data: any, fileKey: string) {
  const params = {
    TableName: process.env.INSTITUTE_METADATA_TABLE_NAME as string,
    Item: {
      fileKey: fileKey,
      institueName: data["Institute Name"],
      instituteClassification: data["Institute Classification"],
      instituteGradeLevels: data["Grades In School"],
      instituteLocation: data["Location"],
      dateOfReview: data["Date of Review"],
    },
  };

  try {
    // Insert metadata into DynamoDB
    await dynamoDb.put(params).promise();
    console.log("Institute metadata inserted into DynamoDB.");
    // Insert metadata into S3 JSON file
    await handleDynamoDbInsert(data, bucket, fileKey);

    if (!extractMetadataQueueUrl) throw Error("No queue url");

    await getMessageInQueue(extractMetadataQueueUrl);
  } catch (error) {
    console.error("Error inserting institute metadata into DynamoDB:", error);
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

async function getMessageInQueue(queueUrl: string) {
  const params = {
    QueueUrl: queueUrl || "",
    AttributeNames: ["ApproximateNumberOfMessages"],
  };

  try {
    const data = await sqs.getQueueAttributes(params).promise();
    const numberOfMessages = data.Attributes?.ApproximateNumberOfMessages;
    console.log(numberOfMessages, ": number");

    if (numberOfMessages === "0") {
      console.log("Syncing starting now");

      // Call SNS topic to sync knowledge base
      await snsClient.send(
        new PublishCommand({
          Message: "Sync",
          TopicArn: Topic.SyncTopic.topicArn,
        })
      );
    }
  } catch (err) {
    console.error("Error fetching queue attributes:", err);
  }
}

// Insert file metadata into DynamoDB
async function insertReportMetadata(data :any, fileKey : string) {
  const params = {
      TableName: process.env.FILE_METADATA_TABLE_NAME as string,
          Key : {fileKey},
          UpdateExpression: "SET instituteName = :instituteName",
          ExpressionAttributeValues: {
              ":instituteName": data["Institute Name"],
          },
          ReturnValues: "UPDATED_NEW",
  };
  return await dynamoDb.update(params).promise();
}

