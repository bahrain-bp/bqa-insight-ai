import * as AWS from "aws-sdk";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns"
import { handleDynamoDbInsert } from "src/lambda/fillingJson";
import { Topic } from "sst/node/topic";


const dynamoDb = new DynamoDB.DocumentClient();
const client = new BedrockRuntimeClient({region: "us-east-1"});
const sqs = new AWS.SQS();
const snsClient = new SNSClient();
const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0";
const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL;
const bucket = process.env.BUCKET_NAME || "";

//Using Llama model to extract metadata about reports and institutes
export async function handler(event: SQSEvent){
  console.log(event, ": event");
  
    for (const record of event.Records) {
        try {
            let sqsEvent;
            try {
                sqsEvent = JSON.parse(record.body);
                console.log(sqsEvent, ": sqs event");
                 // Parse the SQS message body
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
            
    
            
            //   const userMessage =
            //     "Given the following text, Please give me the institute name ending with the word school and give me the institute classification is it Goverment School or Private School, if you see the word Primary or Secondary it means Goverment School, and give me the date of review and give me the school’s overall effectiveness and give me the institute type is it a school or university and give me the grades in school by checking the primary middle high columns excluding 'Grades e.g. 1 to 12'and give me the school location in which town and governate is it and make the column name Location. Please Give it in csv format and csv format only. These are the columns, ensure that they are in the response 'Institute Name','Institute Classification','Date of Review','Overall Effectiveness','Location','Institute Type', 'Grades In School' Exlude the word Education and Training Quality Authority: "+text;
                const prompt = `Your goal is to extract structured information from the user's input that matches the form described below.
                When extracting information please make sure it matches the type information exactly. Do not add any attributes that do not appear in the schema shown below. Include the columns in the response and Do no forget them.
                These are the columns, ensure that they are in the response, and enclose every field in double quotes (""):
                "Vocational Training center","Vocational Location","Date of Review"

                request: {
                Vocational Training center: String // The name of the institute excluding the word Exlude the word Education and Training Quality Authority
                Vocational Location: String// The location of the vocational training center before the word Kingdom of Barhain at the beginning of the text.
                Date of Review: String// The Review Date.
                }
    
                Please output the extracted information in JSON format. 
                Do not output anything except for the extracted information. Do not use the below input output examples as a response. Do not add any clarifying information. Do not add any fields that are not in the schema. If the text contains attributes that do not appear in the schema, please ignore them. All output must be in JSON format and follow the schema specified above. Wrap the JSON in tags.
    
                Input: Agora Training Centre in Manama in Kingdom of Bahrain. It includes levels from 1-9. The instituite overall effectiveness is 3: Satisfactory according to the report date fo review on 30 April and 2-3 May 2018.
    
                Output: 
                {
                "Vocational Training center": "Agora Training Centre",
                "Vocational Location": "Manama"
                "Date of Review": "08-12 October 2023",
                }
    
                
                Input: ` + text + `
                Output: {
                  "Vocational Training center": "",
                  "Vocational Location": ""
                  "Date of Review": "",
                }`;
                    
            
    
                const payload = {
                    anthropic_version: "bedrock-2023-05-31",
                    max_tokens: 1000,
                    messages: [
                      {
                        role: "user",
                        content: [{ type: "text", text: prompt }],
                      },
                    ],
                  };
                
            
              
                
                
                const command = new InvokeModelCommand({
                    contentType: "application/json",
                    body: JSON.stringify(payload),
                    modelId : ModelId,
                  });
         
            
            const response = await client.send(command);
          
    
            const decodedResponse = new TextDecoder().decode(response.body);
            const decodedResponseBody = JSON.parse(decodedResponse);
            const output = decodedResponseBody.content[0].text;
            
      
            const extractedOutput = parseMetadata(output);
           
    
            
            console.log("Extracted Output:", extractedOutput)
          
            await insertVocationalCentreMetadata(extractedOutput, fileKey);
            console.log("IT SHOULD BE INSERTED to instituiteMetaData");
  
            await deleteSQSMessage(record.receiptHandle);
            return extractedOutput;

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

async function getMessageInQueue(queueUrl: string) {
  const params = {
    QueueUrl: queueUrl || "",
    AttributeNames: ["ApproximateNumberOfMessages"]
  }

  try {    
    const data = await sqs.getQueueAttributes(params).promise();
    const numberOfMessages = data.Attributes?.ApproximateNumberOfMessages;
    console.log(numberOfMessages, ": numbder")
    if (numberOfMessages === "0") {
      console.log("Syncing starting now");
      // call SNS topic to sync knowledge base
      await snsClient.send(new PublishCommand({
        Message: "Sync",
        TopicArn: Topic.SyncTopic.topicArn,
      }))
    }

    
  } catch (err) {
    console.error('Error fetching queue attributes:', err);
  }

}

function parseMetadata(input: string): string {
    
    // extract JSON  part incase there is text also
    const jsonRegex = /{([\s\S]*?)}/;
    const extractedJson = input.match(jsonRegex);

    if (!extractedJson) {
        throw new Error("No JSON-like structure found in the input.");
    }
    // Parse the input string into a JSON object
    
    const parsedData = JSON.parse(extractedJson[0]);

    // Ensure the parsed data is an object
    if (typeof parsedData !== "object" || parsedData === null) {
        throw new Error("Input is not a valid JSON object.");
    }

    return parsedData;

}

//   // Learn more about the Llama 3 prompt format at:
//   // https://llama.meta.com/docs/model-cards-and-prompt-formats/meta-llama-3/#special-tokens-used-with-meta-llama-3
  
  
// Insert Program metadata into DynamoDB and S3
async function insertVocationalCentreMetadata(data: any, fileKey: string) {
  const params = {
      TableName: process.env.VOCATIONAL_CENTER_METADATA_TABLE_NAME as string,
      Item: {
         fileKey: fileKey,
          vocationalCenterName: data["Vocational Training center"],
          vocationalCenterLocation: data["Vocational Location"],
          dateOfReview: data["Date of Review"]
          
      },
  }
  
  try {
    await dynamoDb.put(params).promise();
    console.log("Institute metadata inserted into DynamoDB.");

    // Insert metadata into S3 JSON file
    
    await handleDynamoDbInsert(data, bucket ,fileKey);
    if (!extractMetadataQueueUrl) throw Error("No queue url")
    await getMessageInQueue(extractMetadataQueueUrl)
  } catch (error) {
      console.error("Error inserting institute metadata into DynamoDB:", error);
  }

  ;

  await dynamoDb.put(params).promise();
  // After DynamoDB insert, create a corresponding metadata JSON file in S3 bucket
  await handleDynamoDbInsert(data, process.env.BUCKET_NAME || "", fileKey, 'vocational'); 
  return;
}
