import { dependsOn, Script, StackContext, use } from "sst/constructs";
import { BotStack } from "../sst.config";
import { BedrockCollectionStack } from "./BedrockCollectionStack";

export function OpenSearchServerlessStack({ stack }: StackContext) {
//   const { bot, alias } = use(BotStack)
    const {cfnCollection} = use(BedrockCollectionStack)
    dependsOn(BedrockCollectionStack)

//   if (stack.stage === "prod") {
    new Script(stack, "CreateVectorIndexScript", {
      onCreate: {
        handler: 'packages/functions/src/bedrock/createIndex.handler',
        environment: { COLLECTION_ENDPOINT: cfnCollection.attrCollectionEndpoint },
        permissions: ['bedrock', 'opensearch', 'lambda', "aoss:CreateIndex"],
      },
      onUpdate: {
        handler: 'packages/functions/src/bedrock/createIndex.handler',
        environment: { COLLECTION_ENDPOINT: cfnCollection.attrCollectionEndpoint },
        permissions: ['bedrock', 'opensearch', 'lambda', "aoss:CreateIndex"],
      },
    })
//   }
}
