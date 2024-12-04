import { LexRuntimeV2Client, RecognizeTextCommand, RecognizeTextCommandOutput, RecognizeTextRequest, RecognizeTextResponse } from "@aws-sdk/client-lex-runtime-v2";
import { APIGatewayEvent } from "aws-lambda";

interface MessageLexInput {
  message: string
  sessionId: string
}

const lexClient = new LexRuntimeV2Client({ region: "us-east-1" })
export async function handler(event: APIGatewayEvent) {
  const { message, sessionId }: MessageLexInput = JSON.parse(event.body || "{}")
  if (!message || !message.trim()) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Empty text cannot be sent" })
    }
  }
  const text = message.trim()

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
    console.log(lexResponse)
    const messages = lexResponse.messages
    if (!messages || messages.length == 0 || !messages[0]['content']) throw new Error("No message received")
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Response received successfully",
        response: messages[0]['content'],
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
