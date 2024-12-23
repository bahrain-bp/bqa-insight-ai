# --- Helpers that build all of the responses ---

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

    # Handle FallbackIntent
    if intent_name == 'FallbackIntent':
        user_input = intent_request.get('inputTranscript', '').lower()
        if user_input == 'back':
            return elicit_intent(
                intent_request,
                'MainMenuSlot',  # Replace with your main menu slot if needed
                'MainMenuIntent',  # Replace with your actual main menu intent name
            )
        else:
            return close(
                intent_request,
                'Fulfilled',
                create_message("I don't understand it, please type 'back' to return to the main menu.")
            )

    # Handle BQAIntent
    elif intent_name == 'BQAIntent':
        print("doing BQA INTENT")
        bqa_slot = get_slot(intent_request, 'BQASlot')
        if bqa_slot == 'Analyze':
            response = elicit_intent(
                intent_request,
                'InstituteTypeSlot',
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
                'OtherQuestionsSlot',
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
                        "name": "BQAIntent",
                        "state": "InProgress"
                    }
                },
                "messages": [
                    create_message("I'm sorry, I didn't understand that. Please select one of the options: Analyze, Compare, or Other.")
                ]
            }

    # Handle AnalyzingIntent
    elif intent_name == 'AnalyzingIntent':
        slots = get_slots(intent_request)
        
        # Check InstituteTypeSlot first
        institute_type = get_slot(intent_request, 'InstituteTypeSlot')
        if not institute_type:
            return elicit_slot(
                intent_request,
                'InstituteTypeSlot',
                slots=get_slots(intent_request),
            )
        
        # If University is selected, check AnalysisTypeSlot
        if institute_type == 'University':
            slots = get_slots(intent_request)
            if "AnalyzeUniversitySlot" not in slots:
                return elicit_slot(
                    intent_request,
                    'AnalyzeUniversitySlot',
                    slots=get_slots(intent_request),
                )
            analysis_type = get_slot(intent_request, 'AnalyzeUniversitySlot')

            # If Program is selected, check ProgramNameSlot
            if analysis_type == 'Program':
                program_name = get_slot(intent_request, 'ProgramNameSlot')
                if program_name is None :
                    return elicit_slot(
                        intent_request,
                        'ProgramNameSlot',
                        slots=get_slots(intent_request),
                    )

                standard = get_slot(intent_request, 'StandardSlot')
                if standard is None:
                    return elicit_slot(
                        intent_request,
                        'StandardSlot',
                        slots=get_slots(intent_request),
                    )

                message = f"Put hte damn response here bro: {program_name} {standard}"
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here bro"
                return close(
                    intent_request,
                    'Fulfilled',
                    response,
                    session_attributes,
                )

            elif analysis_type == 'Standard':
                return elicit_intent(
                    intent_request,
                    'StandardSlot',
                    "StandardIntent",
                )

                # Only if program name is provided, ask for metric
                # if 'StandardSlot' not in slots :
                #     return elicit_slot(
                #         intent_request,
                #         'StandardSlot',
                #         slots=get_slots(intent_request),
                #     )
                # standard = get_slot(intent_request, 'StandardSlot')
                # response = f"Analyzing {program_name} program at university level with metric: {standard}"
                # message = create_message(response)
                # session_attributes = get_session_attributes(intent_request)
                # session_attributes['chartData'] = 'replace this with chart data'
                # return close(
                #     intent_request,
                #     'Fulfilled',
                #     message,
                #     session_attributes,
                # )

    elif intent_name == 'StandardIntent':
        print("Standard intent, request:", intent_request)
        standard = get_slot(
            intent_request,
            'StandardSlot',
        )
        if standard is not None:
            print("standard slot not available")
            return elicit_slot(
                intent_request,
                'StandardSlot',
            )
        message = f"Put hte damn response here bro: {standard}"
        response = create_message(message)
        session_attributes = get_session_attributes(intent_request)
        session_attributes['chartData'] = "put chart data here bro"
        return close(
            intent_request,
            'Fulfilled',
            response,
            session_attributes,
        )
        
    # Handle ComparingIntent
    elif intent_name == 'ComparingIntent':
        slots = get_slots(intent_request)
        if 'CompareInstituteSlot' not in slots:
            return elicit_slot(
                intent_request,
                'CompareInstituteSlot',
                slots=get_slots(intent_request),
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
        else:
            return close(
                intent_request,
                'Fulfilled',
                create_message("Please select a valid comparison type: Governorate or Specific Institutes.")
            )

    # Handle CompareGovernorateIntent
    elif intent_name == 'CompareGovernorateIntent':
        slots = get_slots(intent_request)
        if 'GovernorateSlot' not in slots:
            return elicit_slot(
                intent_request,
                'GovernorateSlot',
                slots=get_slots(intent_request),
            )

        governorate = get_slot(intent_request, 'GovernorateSlot')
        if governorate is not None:
            response = f"You selected {governorate} for comparison. Processing your request."
        else:
            response = "Please provide a valid governorate."

        message = create_message(response)
        session_attributes = get_session_attributes(intent_request)


        return close(
            intent_request,
            'Fulfilled',
            message,
            session_attributes
        )
    
    elif intent_name == 'CompareInstitutesIntent':
        slots = get_slots(intent_request)
        if 'CompareInstitutesSlot' not in slots:
            return elicit_slot(
                intent_request,
                'CompareInstitutesSlot',
                slots=get_slots(intent_request),
            )

        institutes = get_slot(intent_request, 'CompareInstitutesSlot')
        if institutes is not None:
            response = f"You selected the following institutes for comparison: {institutes}. Processing your request."
        else:
            response = "Please provide the names of the institutes you want to compare."

        message = create_message(response)
        session_attributes = get_session_attributes(intent_request)


        return close(
            intent_request,
            'Fulfilled',
            message,
            session_attributes
        )
    
    

    # Handle OtherIntent
    elif intent_name == 'OtherIntent':
        slots = get_slots(intent_request)
        other_question = get_slot(intent_request, 'OtherQuestionsSlot')
        if other_question:
            response = f"You asked: '{other_question}'. Processing your request."
        else:
            response = "What are the questions in your mind?"

        message = create_message(response)
        return close(
            intent_request,
            'Fulfilled',
            message
        )

    # Handle other intents as needed...
    else:
        # General fallback for undefined intents
        return close(
            intent_request,
            'Fulfilled',
            create_message("I don't understand it, please type 'back' to return to the main menu.")
        )

    return response


def lambda_handler(event, context):
    return dispatch(event)

