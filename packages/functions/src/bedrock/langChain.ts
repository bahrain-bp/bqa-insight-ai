import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { AmazonKnowledgeBaseRetriever } from "@langchain/aws";
import { APIGatewayEvent } from "aws-lambda";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayEvent) => {

    const retriever = new AmazonKnowledgeBaseRetriever({
        topK: 10,
        knowledgeBaseId: process.env.KNOWLEDGEBASE_ID || "",
        region: "us-east-1",
      });
      
      const {text} = JSON.parse(event.body || "{}");

      const query = text;
      
      const response = await retriever.invoke(query);

      // call invoke Model
      
      const prompt = `Your goal is to extract structured information from the user's input that matches the form described below.
      When extracting information please make sure it matches the type information exactly.
    
        Please output the extracted information in JSON format. 
        Do not output anything except for the extracted information. All output must be in JSON format and follow the schema specified below. Wrap the JSON in tags.

        Input: Give me in a graph the histroy overall effectiveness of Sar Primary Boys school
        Output: 
        {
        "chartType": "line",
        "data": [
        {
        "reviewYear": "2019",
        "score": "3"
        },
        {
        "reviewYear": "2020",
        "score": "4"
        },
        {
        "reviewYear": "2021",
        "score": "3.5"
        },
        {
        "reviewYear": "2022",
        "score": "4.2"
        },
        {
        "reviewYear": "2023",
        "score": "4.5"
        }
        ]
        }"    
        }
        Add more columns and provide insightful data to be displayed in a graph. Do not add any clarifying information.
        
        Input: `;

        const final = response + " " + prompt
      const request = {
        prompt: final,
        // Optional inference parameters:
        temperature: 0.5,
        top_p: 0.9,
      };

      const ModelId = "meta.llama3-70b-instruct-v1:0";
      const command = new InvokeModelCommand({
        body: JSON.stringify(request),
        modelId: ModelId,
      });

      const bedrockResponse = await client.send(command);
      const decodedResponse = new TextDecoder().decode(bedrockResponse.body);
      const decodedResponseBody = JSON.parse(decodedResponse);
      const output = decodedResponseBody.generation;

      console.log(decodedResponse);
      console.log("output: ", output);
      
      return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Received Output from Bedrock",
            response: output, // Return the cleaned result here
          }),
        };

}

