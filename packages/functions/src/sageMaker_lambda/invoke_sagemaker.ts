import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const sagemakerClient = new SageMakerRuntimeClient({});
const SAGEMAKER_ENDPOINT_NAME = "jumpstart-dft-meta-textgeneration-l-20241111-101603";

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            throw new Error("No input provided");
        }

        const { input } = JSON.parse(event.body);
        const payload = JSON.stringify({ input });

        // Prepare and send the command to invoke the SageMaker endpoint
        const command = new InvokeEndpointCommand({
            EndpointName: SAGEMAKER_ENDPOINT_NAME,
            Body: Buffer.from(payload), 
            ContentType: "application/json",
        });

        const response = await sagemakerClient.send(command);

        // Convert the response body buffer to string and parse as JSON
        const responseBody = JSON.parse(new TextDecoder("utf-8").decode(response.Body));
        const generatedText = responseBody.generated_text;

        // Format and return the output as required
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                body: {
                    generated_text: generatedText,
                },
                contentType: response.ContentType,
                invokedProductionVariant: response.InvokedProductionVariant,
            }),
        };

    } catch (error) {
        console.error("Error invoking SageMaker endpoint:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error invoking SageMaker endpoint", error: (error as Error).message }),
        };
    }
};
