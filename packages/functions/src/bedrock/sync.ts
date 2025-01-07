import { BedrockAgentClient, StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent";
 
// create the client
const client = new BedrockAgentClient({region: "us-east-1"});

// function to sync knowledgebase
export async function syncKnowlegeBase() {
    // get the knowledgebase id from api
    try {
        const input = {
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
            dataSourceId: process.env.DATASOURCE_BASE_ID
        };
        
        // send the api request to sync
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
