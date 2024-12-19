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
            
    
            
              // const userMessage =
              //   "Given the following text, Please give me the institute name ending with the word school and give me the institute classification is it Goverment School or Private School, if you see the word Primary or Secondary it means Goverment School, and give me the date of review and give me the school’s overall effectiveness and give me the institute type is it a school or university and give me the grades in school by checking the primary middle high columns excluding 'Grades e.g. 1 to 12'and give me the school location in which town and governate is it and make the column name Location. Please Give it in csv format and csv format only. These are the columns, ensure that they are in the response 'Institute Name','Institute Classification','Date of Review','Overall Effectiveness','Location','Institute Type', 'Grades In School' Exlude the word Education and Training Quality Authority: "+text;
                const prompt = `Your goal is to extract structured information from the user's input that matches the form described below.
                When extracting information please make sure it matches the type information exactly. Do not add any attributes that do not appear in the schema shown below. Include the columns in the response and Do no forget them.
               
                request: {
                "Institution Name": "String", // The institute name, excluding phrases like "Education & Training Quality Authority."
                "Location": "String", // The institute's location in Kingdom of Bahrain.
                }
    
                Please output the extracted information in JSON format. 
                Do not output anything except for the extracted information. Do not use the below input output examples as a response. Do not add any clarifying information. Do not add any fields that are not in the schema. If the text contains attributes that do not appear in the schema, please ignore them. All output must be in JSON format and follow the schema specified above. Wrap the JSON in tags.

                Input: ` + text + `
                Output: {
                "Institution Name": "",
                "Location": "",
                `;
                // const prompt = `Your goal is to extract structured information from the user's input that matches the form described below.
                // When extracting information please make sure it matches the type information exactly. Do not add any attributes that do not appear in the schema shown below. Include the columns in the response and Do no forget them.
                // These are the columns, ensure that they are in the response, and enclose every field in double quotes (""):
                // "University Name"
                
                // request: {
                // University Name: String // The name of the University 
                // }
    
                // Please output the extracted information in JSON format. 
                // Do not output anything except for the extracted information. Do not use the below input output examples as a response. Do not add any clarifying information. Do not add any fields that are not in the schema. If the text contains attributes that do not appear in the schema, please ignore them. All output must be in JSON format and follow the schema specified above. Wrap the JSON in tags.
    
                // Input: Bahrain Polytechnic located in Isa Town Bahrain. The number of programs are 22, and the number of qualifications are 22.
                // Output: "University Name"
                // "Bahrain Polytechnic"
    
                // Output: 
                // {
                // "University Name": "Bahrain Polytechnic",
                
                // }
    
                // Input: ` + text + `
                // Output: {
                // "University Name": "",
        
                // }`;
            
    
                // const payload = {
                //     anthropic_version: "bedrock-2023-05-31",
                //     max_tokens: 2000,
                //     temperature: 1,
                //     top_p: 0.999,
                //     top_k: 250,
                //     messages: [
                //       {
                //         role: "user",
                //         content: [{ type: "text", text: prompt }],
                //       },
                //     ],
                //   };
                
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
              
                 
                };
            
                // const request = {
                // payload,
                // temperature: 0.5,
                // top_p: 0.9,
                // };
                
                
                // const command = new InvokeModelCommand({
                //     contentType: "application/json",
                //     body: JSON.stringify(payload),
                //     modelId : ModelId,
                //   });
               
            // const command = new InvokeModelCommand({
            //     body : JSON.stringify(request),
            //     modelId : ModelId,
            // });

            //@ts-ignore
            const command = new ConverseCommand(input);
            
            const response = await client.send(command);
            console.log("HERE IS RESPONSE: ", response);
    
            const modelResponse = response.output?.message?.content?[0]
            //;

            //console.log("model output: ", modelResponse);
           
            
          //   console.log("Final output: ",output)
          //   console.log("output type: ", typeof (output))
          //  // console.log(["Institute Name"])
          //   const extractedOutput = parseMetadata(output);
          //   console.log("EXTRACTED OUTPUT type: ", typeof (extractedOutput))
          //   //console.log("JSON EXTRACTED OUTPUT type: ", typeof JSON.parse(extractedOutput))
    
    
    
            // const parsedOutput = await parseMetadata(output);
    
            
            //console.log("Extracted Output:", extractedOutput)
            // console.log("Extracted Output type:", typeof JSON.parse(extractedOutput))
            // console.log("Extracted Output jsonparsed:", JSON.parse(extractedOutput))
                //const parsed = JSON.parse(extractedOutput);
            // console.log(parsed[0]["School Name"])
            // console.log(extractedOutput["Institute Name"], "Instituite Name");
          //  await insertReportMetadata(extractedOutput, fileKey);
           // console.log("IT SHOULD BE INSERTED to reportMetaData");
    
    
            //data to insert into institueMetadata Table
            // const instName = extractedOutput["Institute Name"];
            // const instType = extractedOutput["Institute Type"];
            // const instClassification = extractedOutput["Institute Classification"];
            // const instGradeLevels = extractedOutput["Grades In School"];
            // const location = extractedOutput["Location"];
    
           // await insertInstituteMetadata(extractedOutput);
           // console.log("IT SHOULD BE INSERTED to instituiteMetaData");
    
           // await deleteSQSMessage(record.receiptHandle);
            return response;

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
async function insertReportMetadata(data :any, fileKey : string) {
    console.log("datatype of data:", typeof data)
    console.log("data zero:",  data)

    const params = {
        TableName: process.env.FILE_METADATA_TABLE_NAME as string,
            Key : {fileKey},
            UpdateExpression: "SET instituteName = :instituteName, ReviewDate = :DateOfReview, SchoolLocation = :SchoolLocation",
            ExpressionAttributeValues: {
                ":instituteName": data["Institute Name"],
                ":DateOfReview": data["Date of Review"],
                ":SchoolLocation": data["Location"]
            },
            ReturnValues: "UPDATED_NEW",
    };
    return await dynamoDb.update(params).promise();
}

// Insert institute metadata into DynamoDB
async function insertInstituteMetadata(data :any) {
    // console.log("datatype of data:", typeof data)
    // console.log("data zero:",  data)

    const params = {
        TableName: process.env.INSTITUTE_METADATA_TABLE_NAME as string,
                      Item: {
                        institueName: data["Institute Name"],
                        instituteType: data["Institute Type"],
                        instituteClassification: data["Institute Classification"],
                        instituteGradeLevels: data["Grades In School"],
                        instituteLocation: data["Location"],
                        dateOfReview: data["Date of Review"],
                        },
                        // UpdateExpression: "SET instituteName = :instituteName, ReviewDate = :DateOfReview, SchoolLocation = :SchoolLocation",
            // ExpressionAttributeValues: {
            //     ":instituteName": data["School Name"],
            //     ":DateOfReview": data["Date of Review"],
            //     ":SchoolLocation": data["School Location"]
            // },
            // ReturnValues: "UPDATED_NEW",
    };
    return await dynamoDb.put(params).promise();
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
  
  