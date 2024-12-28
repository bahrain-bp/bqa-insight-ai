import { APIGatewayEvent } from "aws-lambda";

import {OpenSearchServerlessClient} from "@aws-sdk/client-opensearchserverless";
import { Client } from "@opensearch-project/opensearch";


export async function handler(event: APIGatewayEvent) {
    console.log(event);
    
    const client = new Client({
        node: process.env.COLLECTION_ENDPOINT
    });

    const index = 'bedrock-knowledge-base-default-index';

    // create index if it doesn't already exist
    try {
        if (!(await client.indices.exists({ index })).body) {
            console.log((await client.indices.create({ index })).body);
        }
    } catch(error) {
        console.log("Create Index function error: ", error);        
    }
    

}
