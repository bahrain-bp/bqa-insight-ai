import { dependsOn, Script, StackContext, use } from "sst/constructs";
import { BotStack } from "../sst.config";

export function AfterDeployStack({ stack }: StackContext) {
  const { bot, alias } = use(BotStack)
  dependsOn(BotStack)

  // if (stack.stage === "prod") {
    new Script(stack, "UpdateLexUiScript", {
      onCreate: {
        handler: 'packages/functions/src/LexBot/updateLexUi.handler',
        environment: { BOT_ID: bot.resource.ref, BOT_ALIAS_ID: alias.resource.ref },
        permissions: ['cloudformation', 'iam', 's3', 'lambda', 'cloudfront', 'cognito', 'codebuild:*'],
      },
      onUpdate: {
        handler: 'packages/functions/src/LexBot/updateLexUi.handler',
        environment: { BOT_ID: bot.resource.ref, BOT_ALIAS_ID: alias.resource.ref },
        permissions: ['cloudformation', 'iam', 's3', 'lambda', 'cloudfront', 'cognito', 'codebuild:*'],
      },
    })
  // }
}
