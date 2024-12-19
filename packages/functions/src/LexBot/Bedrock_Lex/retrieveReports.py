from botocore.exceptions import ClientError
import boto3

def invoke_agent(prompt):
    client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")
    
    input_text = {
        'text': prompt
    }

    retrieveAndGenerateConfiguration = {
        'ex'
    }