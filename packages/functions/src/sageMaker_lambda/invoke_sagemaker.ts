import * as AWS from 'aws-sdk';

// Endpoint for SageMaker
const ENDPOINT_NAME = 'jumpstart-dft-meta-textgeneration-l-20241111-101603';
const runtime = new AWS.SageMakerRuntime();

export const lambdaHandler = async (event: any, context: any): Promise<string> => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Check if the event has a body
    const body = event.body;
    if (!body) {
        throw new Error("Request body is missing.");
    }

    // Parse the JSON body
    const data = JSON.parse(body);

    // Ensure the data object contains the expected key
    if (!data || !data.input) {
        throw new Error("Invalid request: 'input' field is missing in the request body.");
    }

    // Construct payload with proper formatting, e.g., JSON
    const payload = JSON.stringify({
        input: data.input  // Adjust key based on what SageMaker expects
    });
    console.log("Formatted Payload:", payload);

    try {
        // Invoke the SageMaker endpoint with proper content type
        const response = await runtime.invokeEndpoint({
            EndpointName: ENDPOINT_NAME,
            ContentType: 'application/json',  // Adjusted based on model requirements
            Body: payload
        }).promise();

        console.log("Response from SageMaker:", response);

        // Parse and log the response
        const result = JSON.parse(response.Body!.toString());
        console.log("Parsed Result:", result);

        // Extract and return model's prediction, adjust based on model’s response format
        const prediction = result.generated_text; // Adjust this if your model returns differently
        return prediction;
    } catch (error) {
        console.error("Error invoking SageMaker endpoint:", error);
        throw new Error(`Error invoking SageMaker endpoint: ${error}`);
    }
};
