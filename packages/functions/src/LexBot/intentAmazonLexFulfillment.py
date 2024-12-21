# from ..bedrock.bedrock_python.invokeBedrockPython import invokeBedrockPython
# --- Helpers that build all of the responses ---

import boto3
import json
import os

from botocore.exceptions import ClientError
# from ..bedrock.bedrock_python.invokeBedrockAgent import invoke_agent
from Bedrock_Lex.invokeBedrockAgent import invoke_agent
from Bedrock_Lex.retrieveReports import get_reports

def create_message(message):
    return {
        'contentType': 'PlainText',
        'content': message,
    }
def get_slots(intent_request):
    return intent_request['sessionState']['intent']['slots']

def get_session_attributes(intent_request):
    sessionState = intent_request['sessionState']
    if 'sessionAttributes' not in sessionState:
        return {}
    return sessionState['sessionAttributes']

def get_slot(intent_request, slotName):
    slots = get_slots(intent_request)
    if slots is None or slotName not in slots or slots[slotName] is None:
        return None
    if len(slots[slotName]['value']['resolvedValues']) == 0:
        return slots[slotName]['value']['originalValue']
    return slots[slotName]['value']['resolvedValues'][0]

def elicit_slot(intent_request, slot_to_elicit, message = None, slots = {}, session_attributes = {}):
    if session_attributes == {}:
        session_attributes = get_session_attributes(intent_request)

    result = {
        'sessionState':
            {'dialogAction':
                {'type': 'ElicitSlot',
                    'slotToElicit': slot_to_elicit,
                },
                'intent':
                    {
                        'name': intent_request['sessionState']['intent']['name'],
                        'slots': slots,
                        'state': 'InProgress',
                    },
                'sessionAttributes': session_attributes,
                'originatingRequestId': 'REQUESTID'
            },
        'sessionId': intent_request['sessionId'],
        'requestAttributes': intent_request['requestAttributes']
        if 'requestAttributes' in intent_request else None
    }
    if message is not None:
        result['messages'] = [message]
    return result

def elicit_intent(intent_request, slot_to_elicit, intent_to_elicit, slots = {}, session_attributes = {}):
    if session_attributes == {}:
        session_attributes = get_session_attributes(intent_request)
    return {
        'sessionState': {
            'dialogAction': {
                'type': 'ElicitSlot',
                'slotToElicit': slot_to_elicit,
            },
            'intent': {
                'confirmationState': 'None',
                'name': intent_to_elicit,
                'slots': slots,
                'state': 'InProgress',
            },
            'sessionAttributes': session_attributes,
            'originatingRequestId': 'REQUESTID'
            # 'originatingRequestId': intent_request['sessionState']['originatingRequestId']
        },
        'sessionId': intent_request['sessionId'],
        # 'messages': [ message ],
        'requestAttributes': intent_request['requestAttributes']
        if 'requestAttributes' in intent_request else None
    }

def close(intent_request, fulfillment_state, message, session_attributes = {}):
    if session_attributes == {}:
        session_attributes = get_session_attributes(intent_request)
    intent_request['sessionState']['intent']['state'] = fulfillment_state
    return {
        'sessionState': {
            'sessionAttributes': session_attributes,
            'dialogAction': {
                'type': 'Close'
            },
            'intent': intent_request['sessionState']['intent'],
            'originatingRequestId': intent_request['sessionState']['originatingRequestId']
            # 'originatingRequestId': 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        },
        'messages': [ message ],
        'sessionId': intent_request['sessionId'],
        'requestAttributes': intent_request['requestAttributes'] if 'requestAttributes' in intent_request else None
    }

def dispatch(intent_request):
    response = None
    intent_name = intent_request['sessionState']['intent']['name']

    if intent_name == 'BQAIntent':
        bqa_slot = get_slot(intent_request, 'BQASlot')

        if bqa_slot == 'Analyze':
            response = elicit_intent(
                intent_request,
                'InstituteSlot',
                "AnalyzingIntent"
            )
        elif bqa_slot == 'Compare':
            response = elicit_intent(
                intent_request,
                'CompareInstituteSlot',
                "ComparingIntent"
            )
        elif bqa_slot == 'Other':
            response = elicit_intent(
                intent_request,
                'InstituteSlot',
                "OtherIntent"
            )
        else:
            response = {
                "sessionState": {
                    "dialogAction": {
                        "type": "ElicitSlot",
                        "slotToElicit": "BQASlot",
                    },
                    "intent": {
                        "name": intent_name,
                        "state": "InProgress"
                    }
                },
            }
            # return close(
            #     intent_request,
            #     get_session_attributes(intent_request),
            #     "Fulfilled",
            #     {
            #         "contentType": "PlainText",
            #         "content":  "What would you like help with?"
            #     }
            # )
    elif intent_name == 'AnalyzingIntent':
        slots = get_slots(intent_request)
        if 'InstituteSlot' not in slots:
            return elicit_slot(
                intent_request,
                'InstituteSlot',
                slots = get_slots(intent_request),
            )
        if 'MetricSlot' not in slots:
            return elicit_slot(
                intent_request,
                'MetricSlot',
                slots = get_slots(intent_request),
            )
        

        
        # these are the slot values
        institute = get_slot(intent_request, 'InstituteSlot')
        metric = get_slot(intent_request, 'MetricSlot')


        agent_id = os.getenv("agentId")
        agent_alias_id = os.getenv("agentAliasId")

        response = invoke_agent(agent_id, agent_alias_id, "123", prompt)
        # print(response)


        message = create_message(response)

        session_attributes = get_session_attributes(intent_request)
        session_attributes['chartData'] = 'replace this with chart data'

        return close(
            intent_request,
            'Fulfilled',
            message,
            session_attributes,
        )
    
    elif intent_name == 'ComparingIntent':
        slots = get_slots(intent_request)
        if 'CompareInstituteSlot' not in slots:
            return elicit_slot(
                intent_request,
                'CompareInstituteSlot',
                slots = get_slots(intent_request),
            )
        
        compare_type = get_slot(intent_request, 'CompareInstituteSlot')
        if compare_type == 'Governorate':
            return elicit_intent(
                intent_request,
                'GovernorateSlot',
                'CompareGovernorateIntent',
            )
        
        elif compare_type == 'Specific Institutes':
            return elicit_intent(
                intent_request,
                'CompareInstitutesSlot',
                'CompareInstitutesIntent',
            )
        
        return close(
            intent_request,
            'Fulfilled',
            message,
            session_attributes,
        )
    
    elif intent_name == 'CompareGovernorateIntent':
        slots = get_slots(intent_request)
        if 'GovernorateSlot' not in slots:
            return elicit_slot(
                intent_request,
                'GovernorateSlot',
                slots=get_slots(intent_request),
            )

        response = "invoke bedrock and put text response in this variable. "
        # these are the slot values
        governorate = get_slot(intent_request, 'GovernorateSlot')
        if governorate is not None:
            response += governorate

        message = create_message(response)

        session_attributes = get_session_attributes(intent_request)
        session_attributes['governorateComparisonData'] = 'replace this with governorate comparison data'

        return close(
            intent_request,
            'Fulfilled',
            message,
            session_attributes,
        )
    
    elif intent_name == 'CompareInstitutesIntent':
        slots = get_slots(intent_request)
        if 'CompareInstitutesSlot' not in slots:
            return elicit_slot(
                intent_request,
                'CompareInstitutesSlot',
                slots=get_slots(intent_request),
            )

        # Process the comparison of specific institutes
        compare_institutes = get_slot(intent_request, 'CompareInstitutesSlot')
        if compare_institutes is not None:
            # Invoke Bedrock and get the response
            response = "Comparison of institutes: " + compare_institutes

        message = create_message(response)
        session_attributes = get_session_attributes(intent_request)
        session_attributes['instituteComparisonData'] = 'replace this with institute comparison data'

        return close(
            intent_request,
            'Fulfilled',
            message,
            session_attributes,
        )

    
    
    else:
        return close(
            intent_request,
            "Fulfilled",
            create_message("What would you like help with?")
        )


    return response


def lambda_handler(event, context):
    return dispatch(event)
