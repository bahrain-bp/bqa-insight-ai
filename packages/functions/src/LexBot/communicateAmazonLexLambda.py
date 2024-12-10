import json
import boto3

client = boto3.client('lexv2-runtime', region_name='us-east-1')

def lambda_handler(event, context):
    # Parse the body from the event
    body = json.loads(event['body'])
    user_input_text = body['text']  # Extract the text field from JSON body

    botId = "6XI9MHNGUC"
    botAliasId = "38NFYTMVBR"
    localeId = "en_US"
    sessionId = "100"

    response = client.recognize_text(
        botId=botId,
        botAliasId=botAliasId,
        localeId=localeId,
        sessionId=sessionId,
        text=user_input_text)
    
    # print("Intent:", response['sessionState']['intent']['name'])
    # print("Next Action:", response['sessionState']['dialogAction']['type'])
    # print("Next Slot:", response['sessionState']['dialogAction']['slotToElicit'])
    print("Prompt or Msg:", response['messages'][0]['content'])

    # Prepare the response message
    prompt_message = response['messages'][0]['content']
    return {
        "statusCode": 200,
        "body": json.dumps({"message": prompt_message})
    }