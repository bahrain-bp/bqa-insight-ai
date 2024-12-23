import { SSTConfig } from "sst";
import { FrontendStack } from "./stacks/FrontendStack";
import { DBStack } from "./stacks/DBStack";
import { ApiStack } from "./stacks/ApiStack";
import { BotStack } from "./stacks/Lexstacks/BotStack";
import { FileMetadataStack } from "./stacks/FileMetadataStack";
import { ImageBuilderForCodeCatalyst } from "./stacks/devops/ImageBuilderForCodeCatalyst";
import { OIDCForGitHubCI } from "./stacks/devops/OIDCForGitHubCI";
import { AuthStack } from "./stacks/AuthStack";
import {S3Stack} from "./stacks/S3Stack";
import { BedrockStack } from "./stacks/BedrockStack";
import { InstituteMetadataStack } from "./stacks/InstituteMetadataStack";
import { UniversityProgramMetadataStack } from "./stacks/UniversityProgramMetadataStack";
import { ProgramMetadataStack } from "./stacks/ProgramMetadataStack";

import { AfterDeployStack } from "./stacks/AfterDeployStack";

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
      .stack(FileMetadataStack)
      .stack(InstituteMetadataStack)
      .stack(UniversityProgramMetadataStack)
      .stack(ProgramMetadataStack)
      .stack(S3Stack)
      .stack(BedrockStack)
      .stack(BotStack)
      .stack(ApiStack) 
      .stack(FrontendStack)
      .stack(AuthStack)
      .stack(AfterDeployStack);
     
    }
  }
} satisfies SSTConfig; 
export { BotStack };
