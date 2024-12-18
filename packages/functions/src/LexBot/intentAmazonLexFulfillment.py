# from ..bedrock.bedrock_python.invokeBedrockPython import invokeBedrockPython
# --- Helpers that build all of the responses ---

import boto3
import json

from botocore.exceptions import ClientError

def invokeBedrockPython(metric, name):
    # event_parsed = json.loads(event["body"])
    # prompt = event_parsed["prompt"]

    prompt = f'''
        Goal :  To evaluate and categorize trends in Bahrain's educational sector across government and private schools, focusing on areas such as students' academic achievement, personal development and well-being, teaching and learning quality, and leadership and governance. The aim is to derive actionable insights into performance, enrollment, and other relevant trends.

Input 1

Question: What are the improvement areas in the government schools this year?

Output:

 Classification: Government schools

Insights: Key improvement areas identified in government schools this year include:

1. Enhancing students' academic achievement through additional STEM programs.
2. Promoting students' personal development with counseling and extracurricular activities.
3. Improving teaching quality by offering professional development workshops for teachers.
4. Strengthening leadership and governance through the introduction of school performance audits.

Input 2

Question: What are the improvement areas in private schools in the past years?

Output:

 Classification: Private schools

Insights:In recent years, private schools have focused on:

1. Boosting academic results by introducing international curricula such as IB and Cambridge standards.
2. Supporting student well-being through wellness programs and mental health initiatives.
3. Adopting modern teaching methods, including project-based learning and digital tools.
4. Enhancing governance through partnerships with international accreditation.

Input 3

Question: What are the government schools doing this year to achieve an outstanding grade?

Output:

Classification: Government schools

Insights:Government schools are implementing strategies to secure outstanding ratings, such as:

1. Introducing rigorous assessment practices to monitor student progress.
2. Fostering collaboration between teachers and parents to improve learning outcomes.
3. Developing leadership skills among administrators through advanced training programs.
4. Creating inclusive classrooms to address diverse learning needs.

Input 4

Question: What are the improvements in private schools compared to government schools?

Output:

Classification: Comparative analysis (Private and Government schools)

Insights:Private schools show advancements in personalized learning approaches and integration of advanced technology, such as AI-driven learning tools, while government schools have prioritized infrastructure development and STEM curriculum updates. Both sectors have made strides in enhancing student well-being programs, though private schools lead in adopting globally recognized teaching frameworks.

Input: How did {name} do in terms of {metric}?
    '''


    client = boto3.client("bedrock-runtime", region_name="us-east-1")
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    native_request = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            }
        ],
    }

    request = json.dumps(native_request)

    try:
    # Invoke the model with the request.
        response = client.invoke_model(modelId=model_id, body=request)

    except (ClientError, Exception) as e:
        print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
        exit(1)

    # Decode the response body.
    model_response = json.loads(response["body"].read())

    # Extract and print the response text.
    response_text = model_response["content"][0]["text"]
    return response_text
    # return json.dumps({
    #     "statusCode": 200,
    #     "output": response_text
    # })


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

        response = invokeBedrockPython(metric, institute)
        print(response)
        # response = "hello"

        if institute is not None and metric is not None:
            response += institute + ", " + metric
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
