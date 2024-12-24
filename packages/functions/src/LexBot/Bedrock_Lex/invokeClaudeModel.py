import boto3
import json

brt = boto3.client(service_name='bedrock-runtime')

def invoke_model(prompt):

    body = json.dumps({
        prompt: prompt
        # "prompt": "\n\nHuman: explain black holes to 8th graders\n\nAssistant:",
        # "max_tokens_to_sample": 300,
        # "temperature": 0.1,
        # "top_p": 0.9,
    })

    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    accept = 'application/json'
    contentType = 'application/json'

    response = brt.invoke_model(body=body, modelId=model_id, accept=accept, contentType=contentType)

    response_body = json.loads(response.get('body').read())

    # text
    print(response_body.get('completion'))
    return response_body.get('completion')