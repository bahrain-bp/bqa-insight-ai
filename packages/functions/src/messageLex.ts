import { LexRuntimeV2Client, RecognizeTextCommand, RecognizeTextCommandOutput, RecognizeTextRequest } from "@aws-sdk/client-lex-runtime-v2";
import { APIGatewayEvent } from "aws-lambda";

interface MessageLexInput {
  message: string
  sessionId: string
}

type Event = APIGatewayEvent & MessageLexInput

const lexClient = new LexRuntimeV2Client({ region: "us-east-1" })
export async function handler({ message, sessionId, ...event}: Event) {
  const text = message.trim()
  if (!text) {
    return {
      statusCode: 500,
      body: { message: "Empty text cannot be sent" }
    }
  }

  const recognizeTextRequest: RecognizeTextRequest = {
    text: text,
    botId: process.env.BOT_ALIAS_ID,
    botAliasId: process.env.BOT_ID,
    sessionId: sessionId,
    localeId: process.env.LOCALE_ID,
  }
  try {
    const recognizeTextCommand = new RecognizeTextCommand(recognizeTextRequest)
    const lexResponse: RecognizeTextCommandOutput = await lexClient.send(recognizeTextCommand)
    const messages = lexResponse.messages
    return {
      statusCode: 200,
      body: {
        message: "Response received successfully",
        messages,

      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "An error has occurred when sending text to Lex", error }
    }
  }
}
