from botocore.exceptions import ClientError
import boto3


def get_reports(knowledgebase_id, name, prompt=""):
    # knowledgebaseId = os.getenv("KNOWLEDGEBASE_ID")
    client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")
    
    response = client.retrieve_and_generate(
            input={
                'text': name
            },
            retrieveAndGenerateConfiguration={
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': knowledgebase_id,
                    'modelArn': 'anthropic.claude-3-sonnet-20240229-v1:0',
                    'generationConfiguration': {
                        'inferenceConfig': {
                            'textInferenceConfig': {
                                'maxTokens': 65530,
                                'temperature': 0.6,
                                'topP': 0.999
                            }
                        }
                    },
                    'retrievalConfiguration': {
                        'vectorSearchConfiguration': {
                            'numberOfResults': 2  # Retrieve top 5 most relevant results
                        }
                    }
                },
                'type': 'KNOWLEDGE_BASE'
            }
        )

    print(response)
    return response