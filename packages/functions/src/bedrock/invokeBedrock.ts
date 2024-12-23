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

      // const ccc = extractResponse(decodedResponse);
      // if (ccc) {
      //   const csvData = extractCsvData(ccc);
      //   if (csvData) {
      //   //   const parsedCsv = parseCsv(csvData);
      //     console.log(csvData);
      //     // here must be the saving
      //      // Set the S3 upload parameters
      //     const cleanedCsvData = csvData.replace(/%\[\d+]%/g, "");
      //     const uploadParams = {
      //       Bucket: process.env.BUCKET_NAME,
      //       Key: 'abc.csv',
      //       Body: cleanedCsvData,                // Directly use the CSV string as the file content
      //       ContentType: "text/csv",        // Set appropriate content type
      //     };
          
      //     const uploadCommand = new PutObjectCommand(uploadParams);
      //     await s3.send(uploadCommand);
      //     console.log("uploaded successfully!")


      //   } else {
      //     console.log("No CSV data found in response.");
      //   }
      // } else {
      //   console.log("No response found in JSON.");
      // }


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
      //body: JSON.stringify({ message: "Invalid request", error: error.message }),
    };
  }
};



// function extractResponse(bedrockResponse: string){
//   // Regular expression to match "response": "value" from the JSON string
//   const regex = /"result"\s*:\s*"([^"]*)"/;

//   // Attempt to find the match
//   const match = bedrockResponse.match(regex);

//   // If match found, return the "response" value; otherwise, return null
//   if (match && match[1]) {
//     return match[1]; // The value of "response" is in match[1]
//   } else {
//     return null; // No "result" field found or it's not a valid string
//   }
// }

// function extractCsvData(bedrockResponse: string){
//   // Regular expression to extract CSV data between backticks
//   const regex = /```tabular-data-csv([\s\S]*?)```/;
//   const match = bedrockResponse.match(regex);
//   return match ? match[1].trim() : null;
// }