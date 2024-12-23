import * as AWS from "aws-sdk";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";

const dynamoDb = new DynamoDB.DocumentClient();
const client = new BedrockRuntimeClient({region: "us-east-1"});
const sqs = new AWS.SQS();
const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0";
const lambda = new AWS.Lambda();

const extractMetadataQueueUrl = process.env.EXTRACT_METADATA_QUEUE_URL;
const schoolLambdaFunctionName = process.env.SCHOOL_LAMBDA_FUNCTION_NAME || "";
const universityLambdaFunctionName = process.env.UNIVERSITY_LAMBDA_FUNCTION_NAME || "";
const programLambdaFunctionName = process.env.PROGRAM_LAMBDA_FUNCTION_NAME || "";

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
        
            const reportType = classifyReport(text);

            // Trigger the appropriate Lambda function
            if (reportType === "school" || "training centre" || "Vocational Reviews") {
                await invokeLambda(schoolLambdaFunctionName, event);
            } else if (reportType === "university") {
                await invokeLambda(universityLambdaFunctionName, event);
            } else if (reportType === "programme") {
                await invokeLambda(programLambdaFunctionName, event);
            } else {
                console.error(`No matching Lambda function for report type: ${reportType}`);
            }
        }catch (error) {
           
            console.error("Error processing SQS message:", error);
        }
    }

}

// Helper function to classify the report based on keywords
function classifyReport(text: string): string {
    if (text.includes("school")) {
        return "school";
    } else if (text.includes("university") || text.includes("higher education") || text.includes("University")) {
        return "university";
    }
    return "unknown";
}
// Helper function to invoke a Lambda function
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



