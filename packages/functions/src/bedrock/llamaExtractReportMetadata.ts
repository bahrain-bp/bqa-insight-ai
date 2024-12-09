import { extractTextFromPDF } from "src/textract";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();
const client = new BedrockRuntimeClient({region: "us-east-1"});

export const llamaExtractReportMetadata = async (event: any) =>{

    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const fileKey = record.s3.object.key;

        console.log(`Processing file from bucket: ${bucketName}, key: ${fileKey}`);
        const payload = {bucketName : bucketName, objectKey: fileKey};

        const textractData = await extractTextFromPDF(payload);
    //    console.log("TEXTRACT DATA: ", textractData);

        const {text} = JSON.parse(textractData.body || "{}");
        console.log("formatted textract: ", text)
        const ModelId = "meta.llama3-70b-instruct-v1:0";

        
        //   const userMessage =
        //     "Given the following text, Please give me the institute name ending with the word school and give me the institute classification is it Goverment School or Private School, if you see the word Primary or Secondary it means Goverment School, and give me the date of review and give me the school’s overall effectiveness and give me the institute type is it a school or university and give me the grades in school by checking the primary middle high columns excluding 'Grades e.g. 1 to 12'and give me the school location in which town and governate is it and make the column name Location. Please Give it in csv format and csv format only. These are the columns, ensure that they are in the response 'Institute Name','Institute Classification','Date of Review','Overall Effectiveness','Location','Institute Type', 'Grades In School' Exlude the word Education and Training Quality Authority: "+text;
          const userMessage = `Your goal is to extract structured information from the user's input that matches the form described below.
          When extracting information please make sure it matches the type information exactly. Do not add any attributes that do not appear in the schema shown below. Include the columns in the response and Do no forget them.
          These are the columns, ensure that they are in the response, and enclose every field in double quotes (""):
          "Institute Name","Institute Classification","Date of Review","Overall Effectiveness","Location","Institute Type", "Grades In School"
          
            request: {
            Institute Name: String // The name of the institute excluding the word Exlude the word Education and Training Quality Authority
            Institute Classification: String// The school give me the institute classification is it Goverment School or Private School, if you see the word Primary or Secondary it means Goverment School.
            Date of Review: String// The date of the review.
            Location: String// The institute location including Town - Governate.
            Institute Type: String// The institute type is it a school or university.
            Grades In School: String // The Grades in school by checking the primary, middle, and high columns excluding 'Grades e.g. 1 to 12'.
            }

            Please output the extracted information in JSON format. 
            Do not output anything except for the extracted information. Do not add any clarifying information. Do not add any fields that are not in the schema. If the text contains attributes that do not appear in the schema, please ignore them. All output must be in JSON format and follow the schema specified above. Wrap the JSON in tags.

            Input: AlRawabi Private School located in sehla Northern Governorate in Bahrain. It includes levels from 1-9. The school overall effectiveness is 3: Satisfactory according to the report date fo review on 30 April and 2-3 May 2018.
            Output: "Institute Name","Institute Classification","Date of Review","Overall Effectiveness","Location","Institute Type", "Grades In School"
            "AlRawabi Private School","Private","30 April and 2-3 May 2018","3: Satisfactory","Sehla - Northern Governorate", "School", "1-9"

            Output: 
            {
            "Institute Name": "AlRawabi Private School",
            "Institute Classification": "Private",
            "Date of Review": "30 April and 2-3 May 2018",
            "Overall Effectiveness": "3: Satisfactory",
            "Location": "Sehla - Northern Governorate",
            "Institute Type": "School",
            "Grades In School": "1-9"
            }

            Input: Jidhafs Secondary Girls School located in Jidhafs Capital Governorate in Bahrain. It includes levels from 10-12. The school overall effectiveness is 3: Satisfactory according to the report date fo review on 30 April and 2-3 May 2018.
            {
            "School Name": "Jidhafs Secondary Girls School",
            "School Classification": "Government School",
            "Date of Review": "30 April and 2-3 May 2018",
            "Overall Effectiveness": "3: Satisfactory",
            "School Location": "Jidhafs - Capital Governorate",
            "School Type": "School",
            "Grades In School": "10-12"
            }


            Input: ` + text + `
            Output: {
            "Institute Name": "",
            "Institute Classification": "",
            "Date of Review": "",
            "Overall Effectiveness": "",
            "Location": "",
            "Institute Type": "",
            "Grades In School": ""
            }`;
                
       

          const prompt = `
          <|begin_of_text|><|start_header_id|>user<|end_header_id|>
          ${userMessage}
          <|eot_id|>
          <|start_header_id|>assistant<|end_header_id|>
          `;
          
     
          const request = {
            prompt,
            temperature: 0.5,
            top_p: 0.9,
          };
         

        const command = new InvokeModelCommand({
            body : JSON.stringify(request),
            modelId : ModelId,
        });
       
        const response = await client.send(command);
        console.log("RESPONSE: ", response)

        const decodedResponse = new TextDecoder().decode(response.body);
        const decodedResponseBody = JSON.parse(decodedResponse);
        const output = decodedResponseBody.generation;
        console.log("Final output: ",output)
        console.log("output type: ", typeof (output))
        console.log(["Institute Name"])
        const extractedOutput = parseMetadata(output);
        //console.log("EXTRACTED OUTPUT type: ", typeof (extractedOutput))
        //console.log("JSON EXTRACTED OUTPUT type: ", typeof JSON.parse(extractedOutput))



        // const parsedOutput = await parseMetadata(output);

       
        console.log("Extracted Output:", extractedOutput)
        // console.log("Extracted Output type:", typeof JSON.parse(extractedOutput))
        // console.log("Extracted Output jsonparsed:", JSON.parse(extractedOutput))
         //const parsed = JSON.parse(extractedOutput);
        // console.log(parsed[0]["School Name"])
       //  await insertReportMetadata(extractedOutput, fileKey);
        //console.log("IT SHOULD BE INSERTED to reportMetaData");


        //data to insert into institueMetadata Table
        //const instName = extractedOutput["Institute Name"];
        //const instType = parsed[0]["Institute Type"];
        // const instClassification = parsed[0]["Institute Classification"];
        // const instGradeLevels = parsed[0]["Grades In School"];
        // const location = parsed[0]["Location"];

        // await insertInstituteMetadata({ institueName : instName, instituteType:instType,instituteClassification: instClassification, instituteGradeLevels: instGradeLevels, instituteLocation: location });
        return extractedOutput;
       
    
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
async function insertInstituteMetadata(institute: { institueName: string; instituteType: string; instituteClassification: string; instituteGradeLevels: string; instituteLocation: string; }) {
    // console.log("datatype of data:", typeof data)
    // console.log("data zero:",  data)

    const params = {
        TableName: process.env.INSTITUTE_METADATA_TABLE_NAME as string,
                      Item: {
                        institueName: institute.institueName,
                        instituteType: institute.instituteType,
                        instituteClassification: institute.instituteClassification,
                        instituteGradeLevels: institute.instituteGradeLevels,
                        instituteLocation: institute.instituteLocation,
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


function extractCsvData(bedrockResponse: string) {
    // Regular expression to extract CSV data between backticks
    const regex = /```tabular-data-csv([\s\S]*?)```/;
    const match = bedrockResponse.match(regex);
    return match ? match[1].trim() : null;
}

function parseCsvToJson(csv: string, delimiter = ','): object {
    const lines = csv.split('\n');  // Split into lines
    const headers = lines[0].split(delimiter); // Extract headers from the first line

    return lines.slice(1).map(line => {
        const values = line.split(delimiter); // Split the line into values
        const entry: { [key: string]: string } = {};

        headers.forEach((header, index) => {
            entry[header.trim()] = values[index]?.trim() || ''; // Map headers to values
        });

        return entry;
    });
}

function processResponse(bedrockResponse: string) {
    const csvData = extractCsvData(bedrockResponse);
    if (!csvData) return null;

    // Parse the CSV data into JSON format
    const json = parseCsvToJson(csvData);

    // Return the JSON result
    return JSON.stringify(json, null, 2);  // Pretty-print the JSON with 2 spaces indentation
}



function parseMetadata(input: string): string {
    
    // Parse the input string into a JSON object
    const parsedData = JSON.parse(input);

    // Ensure the parsed data is an object
    if (typeof parsedData !== "object" || parsedData === null) {
        throw new Error("Input is not a valid JSON object.");
    }

    // Convert the parsed JSON object back to a formatted JSON string
    return JSON.stringify(parsedData, null, 2); // Pretty print with 2 spaces

}


// function parseMetadata(input: string, delimiter = ','): string {
//     // Find the index of the first double quote
//     const startIndex = input.indexOf('"');
//     if (startIndex === -1) {
//         throw new Error('No starting double quote found in the input.');
//     }

//     // Extract content starting from the first double quote
//     const csvContent = input.slice(startIndex).trim();
//     const lines = csvContent.split('\n'); // Split into lines

//     if (lines.length < 2) {
//         throw new Error('Invalid CSV format. Ensure there are headers and at least one row of data.');
//     }

//     // Extract headers and remove surrounding quotes
//     const headers = lines[0].split(delimiter).map(header => header.trim().replace(/^"|"$/g, ''));

//     // Map each subsequent line to a JSON object
//     const json = lines.slice(1).filter(line => line.trim() !== "").map(line => {
//         const values = line.split(delimiter).map(value => value.trim().replace(/^"|"$/g, '')); // Remove quotes from values
//         const entry: { [key: string]: string } = {};

//         headers.forEach((header, index) => {
//             entry[header] = values[index] || ""; // Map headers to values
//         });

//         return entry;
//     });

//     // Return the JSON string with double quotes and pretty formatting
//     return JSON.stringify(json, null, 2);
// }





// // Send a prompt to Meta Llama 3 and print the response stream in real-time.
// import {
//     BedrockRuntimeClient,
//     InvokeModelWithResponseStreamCommand,
//   } from "@aws-sdk/client-bedrock-runtime";
//   
//   // Create a Bedrock Runtime client in the AWS Region of your choice.
//   const client = new BedrockRuntimeClient({ region: "us-west-2" });
  
//   // Set the model ID, e.g., Llama 3 70B Instruct.
//   const modelId = "meta.llama3-70b-instruct-v1:0";
  
//   // Define the user message to send.
//   const userMessage =
//     "Describe the purpose of a 'hello world' program in one sentence.";
  
//   // Embed the message in Llama 3's prompt format.
//   const prompt = `
//   <|begin_of_text|><|start_header_id|>user<|end_header_id|>
//   ${userMessage}
//   <|eot_id|>
//   <|start_header_id|>assistant<|end_header_id|>
//   `;
  
//   // Format the request payload using the model's native structure.
//   const request = {
//     prompt,
//     // Optional inference parameters:
//     max_gen_len: 512,
//     temperature: 0.5,
//     top_p: 0.9,
//   };
  
//   // Encode and send the request.
//   const responseStream = await client.send(
//     new InvokeModelWithResponseStreamCommand({
//       contentType: "application/json",
//       body: JSON.stringify(request),
//       modelId,
//     }),
//   );
  
//   // Extract and print the response stream in real-time.
//   for await (const event of responseStream.body) {
//     /** @type {{ generation: string }} */
//     const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
//     if (chunk.generation) {
//       process.stdout.write(chunk.generation);
//     }
//   }
  
//   // Learn more about the Llama 3 prompt format at:
//   // https://llama.meta.com/docs/model-cards-and-prompt-formats/meta-llama-3/#special-tokens-used-with-meta-llama-3
  
  