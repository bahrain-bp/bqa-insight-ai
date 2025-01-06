import {
  BedrockAgentClient,
  DeleteKnowledgeBaseDocumentsCommand,
} from "@aws-sdk/client-bedrock-agent"; // ES Modules import
const client = new BedrockAgentClient({ region: "us-east-1" });

//The function attempts to delete knowledge base documents
export async function syncDeleteKnowlegeBase(
  knowledgeBaseId: string,
  dataSourceId: string,
  uri: string
) {
  try {
    const input = {
      knowledgeBaseId: knowledgeBaseId,
      dataSourceId: dataSourceId,

      documentIdentifiers: [
        {
          dataSourceType: "S3",
          s3: {
            uri: uri,
          },
        },
      ],
    };
    //@ts-ignore
    // Create and execute the command
    const command = new DeleteKnowledgeBaseDocumentsCommand(input);
    const response = await client.send(command);
    // Log successful deletion and return response
    console.log("Successful sync delete:", response);
    return {
      statusCode: 200,
      body: {
        message: response.documentDetails,
      },
    };
  } catch (error) {
    // Log any errors that occur during execution
    console.log(error);
  }
}
