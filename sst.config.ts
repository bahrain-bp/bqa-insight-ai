import { SSTConfig } from "sst";
import { FrontendStack } from "./stacks/FrontendStack";
import { DBStack } from "./stacks/DBStack";
import { ApiStack } from "./stacks/ApiStack";
import { AmazonLexSolarMapFulfillment } from "./stacks/Lexstacks/AmazonLexSolarMapFulfillment";
import { BQABot } from "./stacks/Lexstacks/BQABot";

import { ImageBuilderForCodeCatalyst } from "./stacks/devops/ImageBuilderForCodeCatalyst";
import { OIDCForGitHubCI } from "./stacks/devops/OIDCForGitHubCI";

export default {
  config(_input) {
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
        .stack(ApiStack)
        .stack(FrontendStack)
        .stack(AmazonLexSolarMapFulfillment)
        .stack(BQABot);
    }
  }
} satisfies SSTConfig;
export { BQABot };