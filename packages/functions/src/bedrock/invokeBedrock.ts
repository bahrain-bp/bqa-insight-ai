import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client();

// interface Response {
//   instruction: string,
//   result: string
// }

export const invokeBedrockAgent = async (event: APIGatewayEvent) => {
  const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

  const agentId = process.env.AGENT_ID;
  const agentAliasId = process.env.AGENT_ALIAS_ID;
  const sessionId = "123";

  try {
    const { prompt } = JSON.parse(event.body || "{}");

    if (!prompt) {
      throw new Error("Text not provided");
    }

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      inputText: prompt,
    });

    try {
      let completion = "";
      const response = await client.send(command);

      if (response.completion === undefined) {
        throw new Error("Completion is undefined");
      }

      // Check for chunk events by iterating through the AsyncIterable
      let hasChunks = false;
      let decodedResponse = "";
      for await (const chunkEvent of response.completion) {
        const chunk = chunkEvent.chunk;

        // Ensure chunk is defined before proceeding
        if (chunk !== undefined && chunk.bytes) {
          hasChunks = true;
          decodedResponse += new TextDecoder("utf-8").decode(chunk.bytes);
          completion += decodedResponse;
        } else {
          console.warn("Received an empty chunk or chunk with no bytes");
        }
      }

      if (!hasChunks) {
        throw new Error("No chunks received in the response");
      }

      console.log("result is: ", typeof decodedResponse)
      // Clean the result by removing % symbols from references
      // decodedResponse = cleanCodeBlockString(decodedResponse)
      // const ccc = convertStringToResponseData(decodedResponse)
      console.log("ccc is: " + decodedResponse)

      const ccc = extractResponse(decodedResponse);
      if (ccc) {
        const csvData = extractCsvData(ccc);
        if (csvData) {
        //   const parsedCsv = parseCsv(csvData);
          console.log(csvData);
          // here must be the saving
           // Set the S3 upload parameters
          const cleanedCsvData = csvData.replace(/%\[\d+]%/g, "");
          const uploadParams = {
            Bucket: process.env.BUCKET_NAME,
            Key: 'abc.csv',
            Body: cleanedCsvData,                // Directly use the CSV string as the file content
            ContentType: "text/csv",        // Set appropriate content type
          };
          
          const uploadCommand = new PutObjectCommand(uploadParams);
          await s3.send(uploadCommand);
          console.log("uploaded successfully!")


        } else {
          console.log("No CSV data found in response.");
        }
      } else {
        console.log("No response found in JSON.");
      }


      const result = JSON.parse(decodedResponse) || "";
      console.log("result is now: " + result)
      const cleanedResult = result.result.replace(/%\[(\d+)]%/g, "");

      // Log for debugging
      console.log("Cleaned result:", cleanedResult);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Received Output from Bedrock",
          response: cleanedResult, // Return the cleaned result here
        }),
      };
    } catch (err) {
      console.error("Error invoking Bedrock agent:", err);
      return {
        statusCode: 500,
       // body: JSON.stringify({ message: "Error invoking Bedrock agent", error: err.message }),
      };
    }
  } catch (error) {
    console.error("Error parsing input or processing request:", error);
    return {
      statusCode: 400,
     // body: JSON.stringify({ message: "Invalid request", error: error.message }),
    };
  }
};

function checkIsMarkDown(input: string): boolean {
  const codeBlock = /```[\s\S]*```/;;
  return codeBlock.test(input);
}

function isValidCSV(csvString: string): boolean {
  // Split the CSV string by rows (handles both `\n` and `\r\n` line breaks)
  const rows = csvString.split(/\r?\n/).map(row => row.trim());

  // If there are no rows or it's just an empty string, it's not valid
  if (rows.length === 0 || rows[0].length === 0) return false;

  // Use a regular expression to validate a basic CSV structure (values separated by commas)
  const csvPattern = /^([^,\r\n]+|"(?:[^"]|\\")*")*(,([^,\r\n]+|"(?:[^"]|\\")*"))*$/;

  // Check if each row matches the CSV pattern
  let columnCount: number | null = null;
  for (let row of rows) {
      // Skip empty rows
      if (row.length === 0) continue;

      // Check if the row matches the CSV format (comma-separated values, with optional quotes)
      if (!csvPattern.test(row)) {
          return false;  // If the row doesn't match, it's not valid CSV
      }

      // Count the number of columns by counting the commas (plus 1)
      const columnInRow = (row.match(/,/g) || []).length + 1;

      // Set the expected column count (must be the same for all rows)
      if (columnCount === null) {
          columnCount = columnInRow;
      } else if (columnInRow !== columnCount) {
          return false;  // Inconsistent number of columns, not valid CSV
      }
  }

  return true;
}

// function cleanCodeBlockString(inputString: string): string {
//   // Define the regular expression for matching content between triple backticks
//   const pattern = /^```([\s\S]*?)```$/s;

//   // Use the replace method to remove the surrounding triple backticks and return the content inside
//   const cleanedString = inputString.replace(pattern, '$1');

//   // Return the cleaned string with trimmed whitespace
//   return cleanedString.trim();
// }

// function parseToCSVFormat(data: Response): string {
//   // Remove the code block markers and get clean CSV
//   const cleanResult = data.result
//     .replace(/```[\w-]*\n?/, '')
//     .replace(/```$/, '');

//   // Return cleaned CSV string
//   return cleanResult.trim();
// }

// function convertStringToResponseData(jsonString: string): Response {
//   const parsed = JSON.parse(jsonString);
  
//   if (
//     typeof parsed === 'object' && 
//     parsed !== null &&
//     'instruction' in parsed &&
//     'result' in parsed &&
//     typeof parsed.instruction === 'string' &&
//     typeof parsed.result === 'string'
//   ) {
//     return parsed as Response;
//   }
  
//   // If validation fails, throw error
//   throw new Error('Invalid data structure');
// }

function extractResponse(bedrockResponse: string){
  // Regular expression to match "response": "value" from the JSON string
  const regex = /"result"\s*:\s*"([^"]*)"/;

  // Attempt to find the match
  const match = bedrockResponse.match(regex);

  // If match found, return the "response" value; otherwise, return null
  if (match && match[1]) {
    return match[1]; // The value of "response" is in match[1]
  } else {
    return null; // No "result" field found or it's not a valid string
  }
}

function extractCsvData(bedrockResponse: string){
  // Regular expression to extract CSV data between backticks
  const regex = /```tabular-data-csv([\s\S]*?)```/;
  const match = bedrockResponse.match(regex);
  return match ? match[1].trim() : null;
}