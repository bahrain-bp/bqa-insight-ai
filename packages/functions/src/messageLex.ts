import { LexRuntimeV2Client, RecognizeTextCommand, RecognizeTextCommandOutput, RecognizeTextRequest, RecognizeTextResponse } from "@aws-sdk/client-lex-runtime-v2";
import { APIGatewayEvent } from "aws-lambda";

interface MessageLexInput {
  message: string
  sessionId: string
}

const lexClient = new LexRuntimeV2Client({ region: "us-east-1" })
export async function handler(event: APIGatewayEvent) {
  const { message, sessionId }: MessageLexInput = JSON.parse(event.body || "{}")
  const text = message.trim()
  if (!text) {
    return {
      statusCode: 500,
      body: { message: "Empty text cannot be sent" }
    }
  }

  const recognizeTextRequest: RecognizeTextRequest = {
    text: text,
    botId: process.env.BOT_ID,
    botAliasId: process.env.BOT_ALIAS_ID,
    sessionId: sessionId,
    localeId: process.env.LOCALE_ID,
  }
  try {
    const recognizeTextCommand = new RecognizeTextCommand(recognizeTextRequest)
    const lexResponse: RecognizeTextResponse = await lexClient.send(recognizeTextCommand)
    const messages = lexResponse.messages
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Response received successfully",
        response: lexResponse,
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "An error has occurred when sending text to Lex",
        error: error,
      })
    }
  }
}
