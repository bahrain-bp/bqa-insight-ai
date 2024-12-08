import { extractTextFromPDF } from "src/textract";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import csv from "csv-parser";
import { Readable } from "stream";

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

        
          const userMessage =
            "Given the following text, Please give me the school name ending with the word school and give me the school classification is it Goverment School or Private School, if you see the word Primary or Secondary it means Goverment School, and give me the date of review and give me the school’s overall effectiveness and give me the school location in which town and governate is it and make the column name School Location. Please Give it in csv format and csv format only. Exlude the word Education and Training Quality Authority: "+text;
          
     
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
        const extractedOutput = parseMetadata(output);


        // const parsedOutput = await parseMetadata(output);

       
        console.log("Extracted Output:", extractedOutput)
        // console.log("Extracted Output type:", typeof JSON.parse(extractedOutput))
        // console.log("Extracted Output jsonparsed:", JSON.parse(extractedOutput))
         const parsed = JSON.parse(extractedOutput);
         console.log(parsed[0]["School Name"])
         await insertReportMetadata(parsed[0], fileKey);
        console.log("IT SHOULD BE INSERTED")


        //static data to insert into institueMetadata Table
        const instName = "Jidhafs Secondary Girls School";
        const instType = "School";
        const instClassification = "Public";
        const instGradeLevels = "High school";
        const location = "Jidhafs";

        //await insertInstituteMetadata({ institueName : instName, instituteType:instType,instituteClassification: instClassification, instituteGradeLevels: instGradeLevels, instituteLocation: location });
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
                ":instituteName": data["School Name"],
                ":DateOfReview": data["Date of Review"],
                ":SchoolLocation": data["School Location"]
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





function parseMetadata(input: string, delimiter = ','): string {
    // Find the index of the first double quote
    const startIndex = input.indexOf('"');
    if (startIndex === -1) {
        throw new Error('No starting double quote found in the input.');
    }

    // Extract content starting from the first double quote
    const csvContent = input.slice(startIndex).trim();
    const lines = csvContent.split('\n'); // Split into lines

    if (lines.length < 2) {
        throw new Error('Invalid CSV format. Ensure there are headers and at least one row of data.');
    }

    // Extract headers and remove surrounding quotes
    const headers = lines[0].split(delimiter).map(header => header.trim().replace(/^"|"$/g, ''));

    // Map each subsequent line to a JSON object
    const json = lines.slice(1).filter(line => line.trim() !== "").map(line => {
        const values = line.split(delimiter).map(value => value.trim().replace(/^"|"$/g, '')); // Remove quotes from values
        const entry: { [key: string]: string } = {};

        headers.forEach((header, index) => {
            entry[header] = values[index] || ""; // Map headers to values
        });

        return entry;
    });

    // Return the JSON string with double quotes and pretty formatting
    return JSON.stringify(json, null, 2);
}





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
  
  