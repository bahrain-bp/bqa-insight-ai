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
            console.log("RESPONSE: ", response)
    
            const decodedResponse = new TextDecoder().decode(response.body);
            const decodedResponseBody = JSON.parse(decodedResponse);
            const output = decodedResponseBody.content[0].text;
            
    
           
    
            const extractedOutput = parseMetadata(output);
            console.log("Extracted Output:", extractedOutput)
        
            await insertInstituteMetadata(extractedOutput, fileKey);
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



// Insert institute metadata into DynamoDB
async function insertInstituteMetadata(data :any , fileKey: string) {
  
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
      await dynamoDb.put(params).promise();
      console.log("Institute metadata inserted into DynamoDB.");
      
    // After successful DynamoDB insert
    // The handleDynamoDbInsert function creates a JSON file with the metadata in the specified S3 bucket
      await handleDynamoDbInsert(data, bucket ,fileKey);
      if (!extractMetadataQueueUrl) throw Error("No queue url")
      await getMessageInQueue(extractMetadataQueueUrl)
  } catch (error) {
      console.error("Error inserting institute metadata into DynamoDB:", error);
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
  
  
