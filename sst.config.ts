import { SSTConfig } from "sst";
import { FrontendStack } from "./stacks/FrontendStack";
import { DBStack } from "./stacks/DBStack";
import { ApiStack } from "./stacks/ApiStack";
import { AmazonLexSolarMapFulfillment } from "./stacks/Lexstacks/AmazonLexSolarMapFulfillment";
import { BotStack } from "./stacks/Lexstacks/BotStack";

import { FileMetadataStack } from "./stacks/FileMetadataStack";
import { ImageBuilderForCodeCatalyst } from "./stacks/devops/ImageBuilderForCodeCatalyst";
import { OIDCForGitHubCI } from "./stacks/devops/OIDCForGitHubCI";
import { AuthStack } from "./stacks/AuthStack";
import {S3Stack} from "./stacks/S3Stack";
import { BedrockStack } from "./stacks/BedrockStack";
// import { BedrockExpressStack } from "./stacks/BedrockExpressStack";

export default {
  config(_input) {
    // Restrict stages to dev or prod
    // const allowedStages = ["dev", "devops-coca","devops-gh","prod"];
    // if (!allowedStages.includes(_input.stage ?? "")) {
    //   throw new Error(
    //       `Invalid stage: ${_input.stage}. Allowed stages are ${allowedStages.join(", ")}.
    //       \n To deploy to a new stage, use "sst deploy --stage dev"`
    //   );
    // }
    return {
      name: "insight-ai",
      region: "us-east-1",
    };
  },
  stacks(app) {
    // Remove all resources when non-prod stages are removed
    if (app.stage !== "prod") {
      app.setDefaultRemovalPolicy("destroy");
    }
    
    if (app.stage == 'devops-coca') {
      app.stack(ImageBuilderForCodeCatalyst)
    }
    else if (app.stage == 'devops-gh') {
      app.stack(OIDCForGitHubCI)
    }
    else {
      app.stack(DBStack)
      .stack(FileMetadataStack)
      .stack(S3Stack)
      .stack(BedrockStack)
      .stack(AmazonLexSolarMapFulfillment)
      .stack(BotStack)
      .stack(ApiStack) 
      .stack(FrontendStack)
      .stack(AuthStack);
      // .stack(BedrockExpressStack);
    }
  }
} satisfies SSTConfig; 
export { BotStack };
