import { LexRuntimeV2Client, PutSessionCommand, PutSessionCommandInput } from "@aws-sdk/client-lex-runtime-v2";
import { APIGatewayEvent } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';

const lexClient = new LexRuntimeV2Client({ region: "us-east-1" })

export async function handler(event: APIGatewayEvent) {
  try {
    const putSessionCommandInput: PutSessionCommandInput = {
      botAliasId: process.env.BOT_ALIAS_ID,
      botId: process.env.BOT_ID,
      localeId: process.env.LOCALE_ID,
      sessionId: uuidv4(),
      sessionState: {},
    }
    const putSessionCommand = new PutSessionCommand(putSessionCommandInput)
    const lexResponse = await lexClient.send(putSessionCommand)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Session started successfully",
        sessionId: lexResponse.sessionId,
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Couldn't start session with Lex",
        error,
      })
    }
  }
}
