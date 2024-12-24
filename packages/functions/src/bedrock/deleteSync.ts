import { BedrockAgentClient, DeleteKnowledgeBaseDocumentsCommand } from "@aws-sdk/client-bedrock-agent"; // ES Modules import
const client = new BedrockAgentClient({region: "us-east-1"});

export async function syncDeleteKnowlegeBase(knowledgeBaseId: string, dataSourceId: string, uri: string) {
    try {
        const input = { // DeleteKnowledgeBaseDocumentsRequest
            knowledgeBaseId: knowledgeBaseId, // required
            dataSourceId: dataSourceId, // required

            documentIdentifiers: [ // DocumentIdentifiers // required
              { // DocumentIdentifier
                dataSourceType: "S3", // required
                s3: { // S3Location
                  uri: uri, // required
                },
              },
            ],
          };
          //@ts-ignore
          const command = new DeleteKnowledgeBaseDocumentsCommand(input);
          const response = await client.send(command);
          console.log("Successful sync delete:", response); 
          return {
            statusCode: 200,
            body: {
                message:  response.documentDetails
            },
        }
            
    } catch (error) {
        console.log(error)
    }
   
}
    
// { // DeleteKnowledgeBaseDocumentsResponse
//   documentDetails: [ // KnowledgeBaseDocumentDetails
//     { // KnowledgeBaseDocumentDetail
//       knowledgeBaseId: "STRING_VALUE", // required
//       dataSourceId: "STRING_VALUE", // required
//       status: "INDEXED" || "PARTIALLY_INDEXED" || "PENDING" || "FAILED" || "METADATA_PARTIALLY_INDEXED" || "METADATA_UPDATE_FAILED" || "IGNORED" || "NOT_FOUND" || "STARTING" || "IN_PROGRESS" || "DELETING" || "DELETE_IN_PROGRESS", // required
//       identifier: { // DocumentIdentifier
//         dataSourceType: "CUSTOM" || "S3", // required
//         s3: { // S3Location
//           uri: "STRING_VALUE", // required
//         },
//         custom: { // CustomDocumentIdentifier
//           id: "STRING_VALUE", // required
//         },
//       },
//       statusReason: "STRING_VALUE",
//       updatedAt: new Date("TIMESTAMP"),
//     },
//   ],
// };

