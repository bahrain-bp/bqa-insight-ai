import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });
const clientAgent = new BedrockAgentRuntimeClient({ region: "us-east-1" });

export const invokeBedrockLlama = async (event: APIGatewayEvent) => {
  const ModelId = "meta.llama3-70b-instruct-v1:0";

  const { userMessage } = JSON.parse(event.body || "{}");

    if (!userMessage) {
      throw new Error("Text not provided");
    }

  const prompt = `
    <|begin_of_text|><|start_header_id|>user<|end_header_id|>
    ${userMessage}
    <|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>
    `;

  const request = {
    prompt,
    // Optional inference parameters:
    temperature: 0.5,
    top_p: 0.9,
  };


  const command = new InvokeModelCommand({
    body: JSON.stringify(request),
    modelId: ModelId,
  });



  // 

const input = { // RetrieveAndGenerateRequest
  // sessionId: "STRING_VALUE",
  input: { // RetrieveAndGenerateInput
    text: prompt, // required
  },
  retrieveAndGenerateConfiguration: { // RetrieveAndGenerateConfiguration
    type: "KNOWLEDGE_BASE",
    knowledgeBaseConfiguration: { // KnowledgeBaseRetrieveAndGenerateConfiguration
      knowledgeBaseId: process.env.KNOWLEDGEBASE_ID, // required
      modelArn: ModelId, // required
  }},
};

  const commandKnowledgeBase = new RetrieveAndGenerateCommand(input);
  const response = await clientAgent.send(commandKnowledgeBase);

  // const response = await client.send(command);
  console.log("RESPONSE: ", response.output?.text)

  // const decodedResponse = new TextDecoder().decode(response.body);
  // const decodedResponseBody = JSON.parse(decodedResponse);
  // const output = decodedResponseBody.results[0].outputText;
  // const nativeResponse = JSON.parse(new TextDecoder().decode(response.body));
  // const responseText = nativeResponse.generation;
  // const extractedOutput = parseMetadata(output);


  // const parsedOutput = await parseMetadata(output);

  // console.log("Final output: ", responseText)

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Received Output from Bedrock",
      response: response.output?.text, // Return the cleaned result here
    }),
  };

  // console.log("Extracted Output:", extractedOutput)
  // console.log("Extracted Output type:", typeof JSON.parse(extractedOutput))
  // console.log("Extracted Output jsonparsed:", JSON.parse(extractedOutput))
}