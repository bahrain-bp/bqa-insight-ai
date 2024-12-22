import * as AWS from "aws-sdk";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";
import { SQSEvent } from "aws-lambda";


const client = new BedrockRuntimeClient({region: "us-east-1"});

const ModelId = "anthropic.claude-3-sonnet-20240229-v1:0";


//Using Llama model to extract metadata about reports and institutes
export async function handler(event: any) {

    console.log(event, ": event");
    const prompt = "What is the report about? School, University, Vocational Training Center";


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

}