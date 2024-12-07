import { extractTextFromPDF } from "src/textract";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import csv from "csv-parser";
import { Readable } from "stream";

const dynamoDb = new DynamoDB.DocumentClient();
const client = new BedrockRuntimeClient({region: "us-east-1"});

export const extractReportMetadata = async (event: any) =>{

    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const fileKey = record.s3.object.key;

        console.log(`Processing file from bucket: ${bucketName}, key: ${fileKey}`);
        const payload = {bucketName : bucketName, objectKey: fileKey};

        const textractData = await extractTextFromPDF(payload);
    //    console.log("TEXTRACT DATA: ", textractData);

       const {text} = JSON.parse(textractData.body || "{}");
        console.log("formatted textract: ", text)
        const ModelId = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1";

        const input = {
            inputText : "Given the following text, give me the school name and give me the date of review and give me the school location including Town and Governate. Give it in csv format and csv format only. Exlude the word Education and Training Quality Authority: "+text,
        }
        

        const command = new InvokeModelCommand({
            body : JSON.stringify(input),
            modelId : ModelId,
        });
       
        const response = await client.send(command);
        console.log("RESPONSE: ", response)

        const decodedResponse = new TextDecoder().decode(response.body);
        const decodedResponseBody = JSON.parse(decodedResponse);
        const output = decodedResponseBody.results[0].outputText;
        const extractedOutput = parseMetadata(output);


        // const parsedOutput = await parseMetadata(output);

        console.log("Final output: ",output)
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

        await insertInstituteMetadata({ institueName : instName, instituteType:instType,instituteClassification: instClassification, instituteGradeLevels: instGradeLevels, instituteLocation: location });
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

// function extractResponse(bedrockResponse: string){
//     // Regular expression to match the string from the JSON string
//     const regex = /"([^"]+)"\s*:\s*"([^"]*)"/;
  
//     // Attempt to find the match
//     const match = bedrockResponse.match(regex);
  
//     // If match found, return the "response" value; otherwise, return null
//     if (match && match[1]) {
//       return match[1]; // The value of "response" is in match[1]
//     } else {
//       return null; // No "result" field found or it's not a valid string
//     }
//   }
  
//   function extractCsvData(bedrockResponse: string){
//     // Regular expression to extract CSV data between backticks
//     const regex = /```tabular-data-csv([\s\S]*?)```/;
//     const match = bedrockResponse.match(regex);
//     return match ? match[1].trim() : null;
//   }

function parseMetadata(input: string, delimiter = ',') {
    // Extract content between the triple backticks
    const matches = input.match(/```tabular-data-csv([\s\S]*?)```/);
    
    if (!matches || matches.length < 2) {
        throw new Error('No valid CSV content found within backticks.');
    }

    const csvContent = matches[1].trim(); // Get the content inside backticks and trim whitespace
    const lines = csvContent.split('\n'); // Split into lines
    const headers = lines[0].split(delimiter); // Extract headers from the first line

    // Map each subsequent line to a JSON object
    const json = lines.slice(1).map(line => {
        const values = line.split(delimiter); // Split the line into values
        const entry: { [key: string]: string } = {};

        headers.forEach((header, index) => {
            entry[header.trim()] = values[index]?.trim() || ""; // Map headers to values
        });

        return entry;
    });

    // Return the JSON string with double quotes
    return JSON.stringify(json, null, 2); // This ensures double quotes and formats the output
}
// function parseMetadata(input: string, delimiter = ','): object {
//     // Extract content between the triple backticks
//     const matches = input.match(/```tabular-data-csv([\s\S]*?)```/);
    
//     if (!matches || matches.length < 2) {
//         throw new Error('No valid CSV content found within backticks.');
//     }

//     const csvContent = matches[1].trim(); // Get the content inside backticks and trim whitespace
//     const lines = csvContent.split('\n'); // Split into lines
//     const headers = lines[0].split(delimiter); // Extract headers from the first line

//     // Map each subsequent line to a JSON object
//     const json = lines.slice(1).map(line => {
//         const values = line.split(delimiter); // Split the line into values
//         const entry: { [key: string]: string } = {};

//         headers.forEach((header, index) => {
//             entry[header.trim()] = values[index]?.trim() || ""; // Map headers to values
//         });

//         return entry;
//     });

//     return json;
// }

//old
// async function parseMetadata(csvData: string): Promise<any[]> {
//   const rows: any[] = [];

//   // Create a readable stream from the CSV data
//   const csvStream = Readable.from(csvData);

//   // Parse the CSV data dynamically
//   await new Promise<void>((resolve, reject) => {
//     csvStream
//       .pipe(csv())
//       .on("data", (data) => {
//         rows.push(data); // Add each row to an array
//       })
//       .on("end", () => {
//         console.log("CSV Parsing Complete. Rows: ", rows); // Debug log
//         resolve();
//       })
//       .on("error", (error) => {
//         console.error("Error Parsing CSV: ", error); // Log errors
//         reject(error);
//       });
//   });

//   return rows; // Explicitly return the parsed rows
// }

