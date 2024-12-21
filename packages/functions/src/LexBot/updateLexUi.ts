import { CloudFormationClient, UpdateStackCommand } from "@aws-sdk/client-cloudformation";
import { APIGatewayEvent } from "aws-lambda";

const cloudClient = new CloudFormationClient();

export async function handler(event: APIGatewayEvent) {
  const response = await cloudClient.send(new UpdateStackCommand({
    StackName: "ali-lex-web-ui",
    UsePreviousTemplate: true,
    Capabilities: ["CAPABILITY_IAM", "CAPABILITY_AUTO_EXPAND"],
    Parameters: [
      {
        ParameterKey: "LexV2BotId",
        ParameterValue: process.env.BOT_ID,
      },
      {
        ParameterKey: "LexV2BotAliasId",
        ParameterValue: process.env.BOT_ALIAS_ID,
      },
      {
        ParameterKey: "TitleLogoImgUrl",
        ParameterValue: "https://www.bqa.gov.bh/BQA_Assets/images/logo-old.png"
      },
      {
        ParameterKey: "BotAvatarImgUrl",
        ParameterValue: "https://lex-ui-avatar.s3.us-east-1.amazonaws.com/avatar-bqa-bot.svg"
      },
      {
        ParameterKey: "CognitoIdentityPoolId",
        ParameterValue: ""
      },
      {
        ParameterKey: "CognitoIdentityPoolName",
        ParameterValue: "Ali Lex Web UI"
      },
    ]
  }))
  console.log(response)
}
