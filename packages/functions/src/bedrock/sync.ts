import { APIGatewayEvent } from "aws-lambda";
import { BedrockAgentClient, StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";
 
const client = new BedrockAgentClient({region: "us-east-1"});

export async function syncKnowlegeBase(knowledgeBaseId: string, dataSourceId: string) {
    try {
        const input = {
            knowledgeBaseId: knowledgeBaseId,
            dataSourceId: dataSourceId
        };
    
        const command = new StartIngestionJobCommand(input);    
        const response = await client.send(command);

        return {
            statusCode: 200,
            body: {
                message:  `Sync Job ${response.ingestionJob?.ingestionJobId} Statrted Successfully.`
            }
        }

    } catch (error)
    {
        return {
            statusCode: 500,
            message: "Data Sync Failed: ", error
        }
    }

}