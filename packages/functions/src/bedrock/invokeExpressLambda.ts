import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayEvent } from "aws-lambda";

export const invokeExpressLambda = async (event: APIGatewayEvent) =>{
    const client = new BedrockRuntimeClient({ region: "us-east-1" });
    const modelId = "amazon.titan-text-express-v1"

    const input = {
        inputText: "hello",
    }
    const command = new InvokeModelCommand({
        contentType: "application/json",
        body : JSON.stringify(input),
        modelId,
    });
    const response = await client.send(command);

    return {
        response : response
    }
}
