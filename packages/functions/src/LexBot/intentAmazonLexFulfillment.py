import json
import random
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

def add_lex_permission(lambda_function_arn):
    # Create a Lambda client
    lambda_client = boto3.client('lambda')

    try:
        # Add permission to invoke the function
        response = lambda_client.add_permission(
            FunctionName=lambda_function_arn,
            StatementId='lex-fulfillment',
            Action='lambda:InvokeFunction',
            Principal='lexv2.amazonaws.com'
        )
        
        print(f"Permission added successfully. Statement ID: {response['StatementId']}")
        
    except ClientError as e:
        print(f"An error occurred while adding permission: {e}")

# Usage
lambda_function_arn = 'arn:aws:lambda:region:account-id:function:function-name'
add_lex_permission(lambda_function_arn)

def dispatch(event):
    print('Event:', json.dumps(event, indent=2))

    response = None

    intent_name = event.get('currentIntent', {}).get('name')
    
    if intent_name == 'WelcomeIntent':
        if event.get('currentIntent', {}).get('slots', {}).get('BQASlot'):
            response = {
                'contentType': 'Y4:0',
                'messageGroups': [{
                    'messageGroup': {
                        'message': {
                            'plainTextMessage': {
                                'value': f"You chose {event['currentIntent']['slots']['BQASlot']}. Please confirm by saying \"Confirm\"."
                            }
                        }
                    }
                }]
            }
        else:
            response = {
                'contentType': 'N',
                'messageGroups': [{
                    'messageGroup': {
                        'message': {
                            'plainTextMessage': {
                                'value': "Please choose an option by clicking one of the buttons."
                            }
                        }
                    }
                }]
            }

    elif intent_name == 'AnalyzingIntent':
        if event['currentIntent']['slots']['BQASlot'] == 'Analyzing':
            response = {
                'contentType': 'N',
                'messageGroups': [{
                    'messageGroup': {
                        'message': {
                            'plainTextMessage': {
                                'value': "Which educational institute would you like to analyze? Please mention one educational institute."
                            }
                        }
                    }
                }]
            }
        else:
            print('Unhandled case in AnalyzingIntent')
            response = {
                'contentType': 'N',
                'messageGroups': [{
                    'messageGroup': {
                        'message': {
                            'plainTextMessage': {
                                'value': "I didn't understand which option you chose. Please try again."
                            }
                        }
                    }
                }]
            }

    else:
        print(f'Unhandled intent: {intent_name}')
        response = {
            'contentType': 'N',
            'messageGroups': [{
                'messageGroup': {
                    'message': {
                        'plainTextMessage': {
                            'value': "I am sorry, I did not understand what you said. Please try again."
                        }
                    }
                }
            }]
        }

    return response

def lambda_handler(event, context):
    return {"message": "Hello"}

