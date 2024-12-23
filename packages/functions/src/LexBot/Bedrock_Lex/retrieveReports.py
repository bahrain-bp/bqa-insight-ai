from botocore.exceptions import ClientError
import boto3


def get_reports(knowledgebase_id, name, prompt=""):
    # knowledgebaseId = os.getenv("KNOWLEDGEBASE_ID")
    client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")
    
    response = client.retrieve_and_generate(
            input={
                'text': prompt
            },
            retrieveAndGenerateConfiguration={
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': knowledgebase_id,
                    'modelArn': 'anthropic.claude-3-sonnet-20240229-v1:0',
                    'generationConfiguration': {
                        'inferenceConfig': {
                            'textInferenceConfig': {
                                'maxTokens': 2000,  # Increased for comprehensive responses
                                'temperature': 0.7,  # Balanced between creativity and accuracy
                                'topP': 0.99
                            }
                        }
                    },
                    'retrievalConfiguration': {
                        'vectorSearchConfiguration': {
                            'numberOfResults': 5,  # Retrieve top 5 most relevant results
                            'filter': {
                                'stringContains': {
                                    'key': 'institueName',  # Assuming 'name' is the field containing institution names
                                    'value': name
                                }
                            }
                        }
                    }
                },
                'type': 'KNOWLEDGE_BASE'
            }
        )

    print(response)