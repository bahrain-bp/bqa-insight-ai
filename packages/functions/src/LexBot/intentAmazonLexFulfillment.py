import json

def dispatch(event):
    print('Event:', json.dumps(event, indent=2))

    response = None

    intent_name = event.get('sessionState', {}).get('intent', {}).get('name')

    if intent_name == 'BQAIntent':
        bqa_slot = event.get('sessionState', {}).get('intent', {}).get('slots', {}).get('BQASlot', {}).get('value', {}).get('interpretedValue')

        if bqa_slot == 'AnalyzingIntent':
            response = {
                "sessionState": {
                    "dialogAction": {"type": "Close"},
                    "intent": {
                        "name": intent_name,
                        "state": "Fulfilled"
                    }
                },
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Which educational institute would you like to analyze? Please mention one educational institute."
                    }
                ]
            }
        elif bqa_slot == 'ComparingIntent':
            response = {
                "sessionState": {
                    "dialogAction": {"type": "Close"},
                    "intent": {
                        "name": intent_name,
                        "state": "Fulfilled"
                    }
                },
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Which educational institutes would you like to compare? Please mention two or more educational institutes."
                    }
                ]
            }
        elif bqa_slot == 'OtherIntent':
            response = {
                "sessionState": {
                    "dialogAction": {"type": "Close"},
                    "intent": {
                        "name": intent_name,
                        "state": "Fulfilled"
                    }
                },
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content":  "What would you like to know?"
                    }
                ]
            }
    # else:
    #     response = {
    #         "sessionState": {
    #             "dialogAction": {"type": "Close"},
    #             "intent": {
    #                 "name": intent_name,
    #                 "state": "Failed"
    #             }
    #         },
    #         "messages": [
    #             {
    #                 "contentType": "PlainText",
    #                 "content": "I am sorry, I did not understand what you said. Please try again."
    #             }
    #         ]
    #     }
        else:
            response = {
                "sessionState": {
                    "dialogAction": {"type": "ElicitSlot", "slotToElicit": "BQASlot"},
                    "intent": {
                        "name": intent_name,
                        "state": "InProgress"
                    }
                },
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please choose an option by clicking one of the buttons."
                    }
                ]
            }


    return response


def lambda_handler(event, context):
    return dispatch(event)
