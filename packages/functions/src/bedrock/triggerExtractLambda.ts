import * as AWS from "aws-sdk";
import { SQSEvent } from "aws-lambda";

// Initialize AWS Lambda client
const lambda = new AWS.Lambda();

// Environment variables for Lambda function names
const schoolLambdaFunctionName = process.env.SCHOOL_LAMBDA_FUNCTION_NAME || "";
const universityLambdaFunctionName = process.env.UNIVERSITY_LAMBDA_FUNCTION_NAME || "";
const programLambdaFunctionName = process.env.PROGRAM_LAMBDA_FUNCTION_NAME || "";
const vocationalCentreLambdaFunctionName = process.env.VOCATIONAL_LAMBDA_FUNCTION_NAME || "";

/**
 * Main handler function triggered by an SQS event.
 * It processes the messages from the SQS queue and routes them to the appropriate Lambda function
 * based on the classification of the report type.
 */
export async function handler(event: SQSEvent) {
  // Loop through each record in the SQS event
  for (const record of event.Records) {
    try {
      let sqsEvent;

      // Parse the SQS message body
      try {
        sqsEvent = JSON.parse(record.body);
      } catch (error) {
        console.error("Error parsing SQS message:", record.body, error);
        continue; // Skip this record if parsing fails
      }

      // Extract `text` and `fileKey` from the parsed SQS message
      const { text, fileKey } = sqsEvent;

      if (!text || !fileKey) {
        console.error("Invalid message content: missing 'text' or 'fileKey'");
        continue; // Skip this record if required fields are missing
      }

      // Classify the report type based on the content of the text
      const reportType = classifyReport(text);
      console.log("The report type is:", reportType);

      // Invoke the corresponding Lambda function based on the report type
      if (reportType === "school") {
        await invokeLambda(schoolLambdaFunctionName, event);
      } else if (reportType === "university") {
        await invokeLambda(universityLambdaFunctionName, event);
      } else if (reportType === "programme") {
        await invokeLambda(programLambdaFunctionName, event);
      } else if (reportType === "vocationalCentre") {
        await invokeLambda(vocationalCentreLambdaFunctionName, event);
      } else {
        console.error(`No matching Lambda function for report type: ${reportType}`);
      }
    } catch (error) {
      console.error("Error processing SQS message:", error);
    }
  }
}

/**
 * Helper function to classify the report type based on keywords (case-insensitive).
 * @param text - The input text to classify.
 * @returns The classified report type as a string (e.g., "school", "university", "programme", or "vocationalCentre").
 */
function classifyReport(text: string): string {
  const lowerText = text.toLowerCase(); // Normalize text to lowercase for case-insensitive matching

  if (
    lowerText.includes("schools reviews") ||
    lowerText.includes("school type") ||
    lowerText.includes("the school’s overall effectiveness") ||
    lowerText.includes("intermediate boys") ||
    lowerText.includes("intermediate girls") ||
    lowerText.includes("primary girls") ||
    lowerText.includes("primary boys") ||
    lowerText.includes("secondary boys") ||
    lowerText.includes("secondary girls") ||
    lowerText.includes("private schools") ||
    lowerText.includes("schools & kindergartens reviews") ||
    lowerText.includes("private schools & kindergartens reviews")
  ) {
    return "school";
  } else if (
    lowerText.includes("institutional review report") ||
    lowerText.includes("institution profile")
  ) {
    return "university";
  } else if (
    lowerText.includes("programmes-within-college reviews") ||
    lowerText.includes("programme review report") ||
    lowerText.includes("degree in") ||
    lowerText.includes("bachelor in") ||
    lowerText.includes("college of")
  ) {
    return "programme";
  } else if (
    lowerText.includes("training centre") ||
    lowerText.includes("training center") ||
    lowerText.includes("vocational reviews") ||
    lowerText.includes("training & development") ||
    lowerText.includes("directorate of vocational reviews")
  ) {
    return "vocationalCentre";
  }

  return "unknown"; // Default case if no keywords match
}

/**
 * Helper function to invoke a specific Lambda function asynchronously.
 * @param functionName - The name of the Lambda function to invoke.
 * @param payload - The payload to send to the Lambda function.
 */
async function invokeLambda(functionName: string, payload: any) {
  try {
    if (!functionName) {
      throw new Error("Lambda function name is not defined");
    }

    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event", // Asynchronous invocation
        Payload: JSON.stringify(payload),
      })
      .promise();

    console.log(`Successfully invoked Lambda function: ${functionName}`);
  } catch (error) {
    console.error(`Error invoking Lambda function (${functionName}):`, error);
  }
}
