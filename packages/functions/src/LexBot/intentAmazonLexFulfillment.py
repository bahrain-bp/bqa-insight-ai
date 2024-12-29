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

    # # Handle FallbackIntent
    # if intent_name == 'FallbackIntent':
    #     user_input = intent_request()
    #     if user_input == 'back':
    #         return elicit_intent(
    #             intent_request,
    #             'BQASlot',  # Replace with your main menu slot if needed
    #             'BQAIntent',  # Replace with your actual main menu intent name
    #         )
    #     else:
    #         return close(
    #             intent_request,
    #             'Fulfilled',
    #             create_message("I don't understand it, please type 'back' to return to the main menu.")
    #         )

    # Handle BQAIntent
    if intent_name == 'BQAIntent':
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
                "InstituteCompareTypeSlot",
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
        
        if institute_type == 'School':
             schoolaspect = get_slot(intent_request, "SchoolAspectSlot")
             if schoolaspect is None:
                return elicit_slot(
                    intent_request,
                    'SchoolAspectSlot',
                    slots=get_slots(intent_request)
                ) 
             schoolname = get_slot(intent_request, "AnalyzeSchoolSlot")
             if schoolname is None:
                  return elicit_slot(
                    intent_request,
                    'AnalyzeSchoolSlot',
                    slots=get_slots(intent_request)
                ) 
             message = f"the school aspect : {schoolaspect} choosen for the {schoolname} school"
             response = create_message(message)
             session_attributes = get_session_attributes(intent_request)
             session_attributes['chartData'] = "put chart data here"
             return close(
                 intent_request,
                 'Fulfilled',
                 response,
                 session_attributes
             )
        
        elif institute_type == 'Vocational training center':
             vocationalaspect = get_slot(intent_request, "VocationalAspectSlot")
             if vocationalaspect is None:
                return elicit_slot(
                    intent_request,
                    'VocationalAspectSlot',
                    slots=get_slots(intent_request)
                ) 
             vocational = get_slot(intent_request, "AnalyzeVocationalSlot")
             if vocational is None:
                  return elicit_slot(
                    intent_request,
                    'AnalyzeVocationalSlot',
                    slots=get_slots(intent_request)
                ) 
             message = f"the vocational training center : {vocational} choosen for the {vocationalaspect} aspect"
             response = create_message(message)
             session_attributes = get_session_attributes(intent_request)
             session_attributes['chartData'] = "put chart data here"
             return close(
                 intent_request,
                 'Fulfilled',
                 response,
                 session_attributes
             )
        
        # If University is selected, check AnalysisTypeSlot
        elif institute_type == 'University':
            analysis_type = get_slot(intent_request, 'AnalyzeUniversitySlot')
            if not analysis_type:
               return elicit_slot(
                intent_request,
                'AnalyzeUniversitySlot',
                slots=get_slots(intent_request),
            )
          

            # If Program is selected, check ProgramNameSlot
            if analysis_type == 'Program Review':
                program_name = get_slot(intent_request, 'ProgramNameSlot')
                if program_name is None :
                    return elicit_slot(
                        intent_request,
                        'ProgramNameSlot',
                        slots=get_slots(intent_request),
                    )

                standard = get_slot(intent_request, 'StandardProgSlot')
                if standard is None:
                    return elicit_slot(
                        intent_request,
                        'StandardProgSlot',
                        slots=get_slots(intent_request),
                    )

                message = f"for the following {standard} the standard {program_name} "
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here bro"
                return close(
                    intent_request,
                    'Fulfilled',
                    response,
                    session_attributes,
                )

            elif analysis_type == 'Institutional Review':
                return elicit_intent(
                    intent_request,
                    'StandardSlot',
                    "StandardIntent",
                )

    elif intent_name == 'StandardIntent':
      
        print("Standard intent, request:", intent_request)
        standard = get_slot(
            intent_request,
            'StandardSlot',
        )
        if standard is None:
            print("standard slot not available")
            return elicit_slot(
                intent_request,
                'StandardSlot',
            )
        message = f"the standared of the program is: {standard}"
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
        
        # Check InstituteTypeSlot first
        institutecompare_type = get_slot(intent_request, 'InstituteCompareTypeSlot')
        if not institutecompare_type:
            return elicit_slot(
                intent_request,
                'InstituteCompareTypeSlot',
                slots=get_slots(intent_request),
            )
        
        if institutecompare_type == 'University':
            compare_types = get_slot(intent_request,'CompareUniversitySlot')
            if not compare_types:
                  return elicit_slot(
                intent_request,
                'CompareUniversitySlot',
                slots=get_slots(intent_request),
            )

            # comp_type = get_slot(intent_request, 'CompareUniSlot')
            # if not comp_type:
            #       return elicit_slot(
            #         intent_request,
            #         'CompareUniSlot',
            #         slots=get_slots(intent_request)
            #  )


            if compare_types == 'Institutional review':
                Uni_name = get_slot(intent_request,'CompareUniSlot')
                if Uni_name is None:
                    return elicit_slot(
                        intent_request,
                        'CompareUniSlot',
                        slots=get_slots(intent_request),
                    )
                
                comp_type = get_slot(intent_request,'CompareUniversityWUniSlot')
                if not comp_type:
                    return elicit_slot(
                        intent_request,
                        'CompareUniversityWUniSlot',
                        slots=get_slots(intent_request)
                    )
                

                message = f"based on {Uni_name} and the universities: {comp_type}"
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here "
                return close(
                    intent_request,
                    'Fulfilled',
                    response,
                    session_attributes,
                )
        
            elif compare_types == 'Programs':
                programs_st = get_slot(intent_request,'CompareUniversityWProgramsSlot')
                if programs_st is None:
                    return elicit_slot(
                        intent_request,
                        'CompareUniversityWProgramsSlot',
                        slots=get_slots(intent_request),
                    )
                
                program_names = get_slot(intent_request,'CompareUniversityWprogSlot')
                if program_names is None:
                    return elicit_slot(
                        intent_request,
                        'CompareUniversityWprogSlot',
                        slots=get_slots(intent_request)
                    )
                

        
                message = f"the program standatd {programs_st} for the {program_names}"
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here "
                return close(
                        intent_request,
                        'Fulfilled',
                        response,
                        session_attributes,
                    )
    
        elif institutecompare_type == 'School':
            compareschool_aspect = get_slot(intent_request,'CompareSchoolAspectlSlot')
            if compareschool_aspect is None:
                return elicit_slot(
                    intent_request,
                    'CompareSchoolAspectlSlot',
                    slots=get_slots(intent_request),
                )  
            
            compareschool_type = get_slot(intent_request,'CompareSchoolSlot')
            if compareschool_type is None:
                return elicit_slot(
                    intent_request,
                    'CompareSchoolSlot',
                    slots=get_slots(intent_request)
                )
            
            if compareschool_type == 'Governorate':
                governorate_name = get_slot(intent_request,'GovernorateSlot')
                if governorate_name is None:
                    return elicit_slot(
                        intent_request,
                        'GovernorateSlot',
                        slots=get_slots(intent_request),
                    )
                message = f"the governorate you selected is: {governorate_name} for the aspect {compareschool_aspect}"
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here "
                return close(
                        intent_request,
                        'Fulfilled',
                        response,
                        session_attributes,
                    )
            
            elif compareschool_type == 'Specific Institutes':
                specificInstitutes_name = get_slot(intent_request,'CompareSpecificInstitutesSlot')
                if specificInstitutes_name is None:
                    return elicit_slot(
                        intent_request,
                        'CompareSpecificInstitutesSlot',
                        slots=get_slots(intent_request),
                    )
                message = f"Comparision of Institutes: {specificInstitutes_name} for the aspect {compareschool_aspect}"
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here "
                return close(
                        intent_request,
                        'Fulfilled',
                        response,
                        session_attributes,
                    )
            
            elif compareschool_type == "All Government Schools" or compareschool_type == 'All Private Schools':
                message = f"Comparision of schools: {compareschool_type} for the aspect {compareschool_aspect}"
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here "
                return close(
                        intent_request,
                        'Fulfilled',
                        response,
                        session_attributes,
                    )
            
        elif institutecompare_type == 'Vocational training center':
            comparevocationalaspect = get_slot(intent_request,'CompareVocationalaspectSlot')
            if comparevocationalaspect is None:
                return elicit_slot(
                    intent_request,
                    'CompareVocationalaspectSlot',
                    slots=get_slots(intent_request),
                )  
            comparevocational_type = get_slot(intent_request, "CompareVocationalSlot")
            if comparevocational_type is None:
                  return elicit_slot(
                    intent_request,
                    'CompareVocationalSlot',
                    slots=get_slots(intent_request)
                ) 
            message = f"the vocational training center : {comparevocational_type} choosen for the {comparevocationalaspect} aspect"
            response = create_message(message)
            session_attributes = get_session_attributes(intent_request)
            session_attributes['chartData'] = "put chart data here"
            return close(
                 intent_request,
                 'Fulfilled',
                 response,
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

