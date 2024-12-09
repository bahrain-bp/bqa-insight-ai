import json
import random
from decimal import Decimal

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
    return dispatch(event)