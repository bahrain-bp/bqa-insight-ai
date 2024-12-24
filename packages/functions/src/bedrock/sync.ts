import { BedrockAgentClient, StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";
 
const client = new BedrockAgentClient({region: "us-east-1"});

export async function syncKnowlegeBase() {
    try {
        const input = {
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
            dataSourceId: process.env.DATASOURCE_BASE_ID
        };
    
        const command = new StartIngestionJobCommand(input);    
        const response = await client.send(command);

        console.log("Syncing complete")
        return {
            statusCode: 200,
            body: {
                message:  `Sync Job ${response.ingestionJob?.ingestionJobId} Statrted Successfully.`
            }
        }

    } catch (error)
    {
        console.log(error)
        return {
            statusCode: 500,
            message: "Data Sync Failed: ", error
        }
    }

}
