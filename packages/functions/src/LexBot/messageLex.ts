import { LexRuntimeV2Client, RecognizeTextCommand, RecognizeTextCommandOutput, RecognizeTextRequest, RecognizeTextResponse } from "@aws-sdk/client-lex-runtime-v2";
import { APIGatewayEvent } from "aws-lambda";

interface LexOptions {
  retry?: boolean
  return?: boolean
}

interface MessageLexInput {
  message: string
  sessionId: string
  options?: LexOptions
}

const lexClient = new LexRuntimeV2Client({ region: "us-east-1" })
export async function handler(event: APIGatewayEvent) {
  const { message, sessionId, options }: MessageLexInput = JSON.parse(event.body || "{}")
  if (!options && (!message || !message.trim()) ) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Empty text cannot be sent" })
    }
  }
  const text = message ? message.trim() : "back"
  const retryMessage = options?.retry ? "true" : "false"
  const returnMessage = options?.return ? "true" : "false"

  const recognizeTextRequest: RecognizeTextRequest = {
    text: text,
    botId: process.env.BOT_ID,
    botAliasId: process.env.BOT_ALIAS_ID,
    sessionId: sessionId,
    localeId: process.env.LOCALE_ID,
    sessionState: {
      sessionAttributes: {
        retry: retryMessage,
        return: returnMessage,
      }
    }
  }
  try {
    const recognizeTextCommand = new RecognizeTextCommand(recognizeTextRequest)
    const lexResponse: RecognizeTextResponse = await lexClient.send(recognizeTextCommand)
    console.log(lexResponse)
    const messages = lexResponse.messages
    // if (!messages || messages.length == 0 || !messages[0]['content']) throw new Error("No message received")
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Response received successfully",
        response: lexResponse,
      })
    }
  } catch (error) {
    console.log(error)
    if (error instanceof Error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "An error has occurred when sending text to Lex",
          error: error.message,
        })
      }
    }
  }
}
