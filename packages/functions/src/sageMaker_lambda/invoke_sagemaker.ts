import {SageMakerRuntime } from "@aws-sdk/client-sagemaker-runtime";
import { APIGatewayEvent } from "aws-lambda";

const sagemakerClient = new SageMakerRuntime({region: "us-east-1"});
const SAGEMAKER_ENDPOINT_NAME = "jumpstart-dft-meta-textgeneration-l-20241112-090312";

export const lambdaHandler = async (event: APIGatewayEvent) => {
    try {
        if (!event.body) {
            throw new Error("No input provided");
        }

        const requestBody = JSON.parse(event.body || "{}");

        const payload = {
            inputs: requestBody.input,
            parameters: {
                max_new_tokens: 64,
                top_p: 0.9,
                temperature: 0.6
            }
        };

        const params = {
            EndpointName: SAGEMAKER_ENDPOINT_NAME,
            Body: JSON.stringify(payload),
            ContentType: 'application/json',
            Accept: 'application/json'
          };

        const response = await sagemakerClient.invokeEndpoint(params);

        const textRespone = (Buffer.from(response.Body)).toString();
        const parsedResponse = JSON.parse(textRespone);

        return {
            statusCode: 200,
            body: JSON.stringify({
                output: parsedResponse.generated_text
              })
        }
        

    } catch (error) {
        console.error("Error invoking SageMaker endpoint:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error invoking SageMaker endpoint", error: (error as Error).message }),
        };
    }
};
