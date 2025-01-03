# from ..bedrock.bedrock_python.invokeBedrockPython import invokeBedrockPython
# --- Helpers that build all of the responses ---

import boto3
import json
import os

from botocore.exceptions import ClientError
from Bedrock_Lex.invokeBedrockAgent import invoke_agent
from Bedrock_Lex.retrieveReports import get_reports
from Bedrock_Lex.prompts import *
from Bedrock_Lex.invokeClaudeModel import invoke_model

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

def get_slot_history(session_attributes):
    slot_string = session_attributes.get('slotHistory')
    if slot_string is None:
        return []
    # expected format:
    # "BQAIntent:BQASlot,AnalyzingIntent:InstitutionTypeSlot,AnalyzingIntent:SchoolMetricSlot"
    # slots are described by an intent name "BQAIntent:BQASlot"
    # and each slot is separated by commas
    # this will parse a string with this format to a 2D list

    slots = slot_string.split(',')
    total = []
    for slot in slots:
        total.append(slot.split(":"))
    return total

def set_slot_history(slot_list, session_attributes):
    # this will convert a 2D list with the aforementioned format to a string
    slots = []
    for slot in slot_list:
        slots.append(':'.join(slot))
    slot_string = ','.join(slots)
    if slot_string is None:
        slot_string = ""
    session_attributes['slotHistory'] = slot_string

def update_slot_history(session_attributes, slot_to_elicit, intent_name):
    slot_list = get_slot_history(session_attributes)

    last_slot = None
    if len(slot_list) > 0:
        last_slot = slot_list[-1]

    slot_name = ""
    if last_slot is not None and len(last_slot) > 1:
        slot_name = last_slot[1]

    if slot_name != slot_to_elicit:
        slot_list.append([intent_name, slot_to_elicit])
    set_slot_history(slot_list, session_attributes)

def retry_last_slot(intent_request):
    session_attributes = get_session_attributes(intent_request)
    slot_list = get_slot_history(session_attributes)
    # remove last slot
    last_slot = slot_list.pop()
    # get slots from session_attributes if they exist
    WAS_FOLLOWUP = 'slots' in session_attributes and 'OtherQuestionsSlot' in last_slot
    if WAS_FOLLOWUP:
        intent_request['sessionState']['intent']['slots'] = json.loads(session_attributes['slots'])
        session_attributes.pop('slots')
    else:
        intent_request['sessionState']['intent']['slots'].pop(last_slot[1])
    current_intent = last_slot[0]
    set_slot_history(slot_list, session_attributes)
    session_attributes['retry'] = 'false'
    # get last slot, this will be reset
    if len(slot_list) > 0:
        last_slot = slot_list[-1]
        print("The last item is ", last_slot)
        print("The array is ", slot_list)
    else:
        # if nothing in the history is left, return to main menu
        return elicit_intent(
            intent_request,
            "BQASlot",
            "BQAIntent",
        )

    if current_intent != last_slot[0]:
        response = elicit_intent(
            intent_request,
            last_slot[1],
            last_slot[0],
        )
        if WAS_FOLLOWUP:
            response['sessionState']['intent']['slots'] = get_slots(intent_request)
    else:
        response = elicit_slot(
            intent_request,
            last_slot[1],
            slots=get_slots(intent_request),
        )
    print("Response after retry: ", response)

    return response

def elicit_slot(intent_request, slot_to_elicit, message = None, slots = {}, session_attributes = {}):
    if session_attributes == {}:
        session_attributes = get_session_attributes(intent_request)

    intent_name = intent_request['sessionState']['intent']['name']
    update_slot_history(session_attributes, slot_to_elicit, intent_name)

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


def elicit_intent(intent_request, slot_to_elicit, intent_to_elicit, message=None, slots = {}, session_attributes = {}):
    intent_request['sessionState']['intent']['confirmationState'] = 'None'
    intent_request['sessionState']['intent']['name'] = intent_to_elicit
    response = elicit_slot(
        intent_request,
        slot_to_elicit,
        slots=slots,
        session_attributes=session_attributes,
        message=message,
    )
    return response

def followup(intent_request, message):
    response = elicit_intent(
        intent_request,
        'OtherQuestionsSlot',
        'OtherIntent',
        message=message,
    )
    slots = get_slots(intent_request)
    if 'OtherQuestionsSlot' not in slots:
        intent_request['sessionState']['sessionAttributes']['slots'] = json.dumps(slots)
    return response

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
    
    # Get Bedrock ageant id and alias id
    agent_id = os.getenv("agentId")
    agent_alias_id = os.getenv("agentAliasId")

    response = None
    intent_name = intent_request['sessionState']['intent']['name']
    returnToMenu = get_session_attributes(intent_request).get('return')
    retrySlots = get_session_attributes(intent_request).get('retry')
    session_id = intent_request['sessionId']

    # If user wants to go back to the main menu, elicit BQAIntent
    if returnToMenu and returnToMenu == 'true':
        intent_request['sessionState']['sessionAttributes']['return'] = 'false'
        set_slot_history([],intent_request['sessionState']['sessionAttributes'])
        if 'slots' in get_session_attributes(intent_request):
            intent_request['sessionState']['sessionAttributes'].pop('slots')
        return elicit_intent(
            intent_request,
            "BQASlot",
            "BQAIntent",
        )

    if retrySlots and retrySlots == 'true':
        return retry_last_slot(intent_request)

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
            #  message = f"the school aspect : {schoolaspect} choosen for the {schoolname} school"
             school_analyze_prompt = create_school_analyze_prompt(schoolname, schoolaspect)
             message = invoke_agent(agent_id, agent_alias_id, session_id, school_analyze_prompt)
             response = create_message(message)
             session_attributes = get_session_attributes(intent_request)
             return followup(intent_request, response)
        
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
            #  message = f"the vocational training center : {vocational} choosen for the {vocationalaspect} aspect"
             analyze_vocational_training_centre_prompt = create_analyze_vocational_training_centre(vocational, vocationalaspect)
             message = invoke_agent(agent_id, agent_alias_id, session_id, analyze_vocational_training_centre_prompt)
             response = create_message(message)
             session_attributes = get_session_attributes(intent_request)
             
             return followup(intent_request, response)
        
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
                
                university = get_slot(intent_request, 'UniNameSlot')
                if university is None:
                    return elicit_slot(
                        intent_request,
                        'UniNameSlot',
                        slots=get_slots(intent_request)
                    )

                # message = f"for the following {standard} the standard {program_name} {university}"
                analyze_university_programme_prompt = create_uni_analyze_prompt(standard, university, program_name=program_name)
                message = invoke_agent(agent_id, agent_alias_id, session_id, analyze_university_programme_prompt)
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                
                return followup(intent_request, response)

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
                slots=get_slots(intent_request),
            )
        

        university_name = get_slot(
            intent_request,
            'AnalyzeUniversityNameSlot',
        )
        if university_name is None:
            return elicit_slot(
                intent_request,
                'AnalyzeUniversityNameSlot',
            )

        # university here
        # message = f"the standared of the program is: {standard} {university_name}"
        analyze_university_prompt = create_uni_analyze_prompt(standard, university_name)
        message = invoke_agent(agent_id, agent_alias_id, session_id, analyze_university_prompt)
        response = create_message(message)
        session_attributes = get_session_attributes(intent_request)
        
        return followup(intent_request, response)
    
    
        
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
                standard_name = get_slot(intent_request,'CompareUniStandardSlot')
                if standard_name is None:
                    return elicit_slot(
                        intent_request,
                        'CompareUniStandardSlot',
                        slots=get_slots(intent_request),
                    )
                
                universities = get_slot(intent_request,'CompareUniversityUniSlot')
                if not universities:
                    return elicit_slot(
                        intent_request,
                        'CompareUniversityUniSlot',
                        slots=get_slots(intent_request)
                    )
                

                # message = f"based on {standard_name} and the universities: {universities} here is the new one"
                compare_uni_prompt = create_compare_uni_prompt(universities, standard_name)
                message = invoke_agent(agent_id, agent_alias_id, session_id, compare_uni_prompt)
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                
                return followup(intent_request, response)
        
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
                
                universities = get_slot(intent_request,'CompareUniversityWprogUniversityNameSlot')
                if universities is None:
                    return elicit_slot(
                        intent_request,
                        'CompareUniversityWprogUniversityNameSlot',
                        slots=get_slots(intent_request)
                    )
                

        
                # message = f"the program standatd {programs_st} for the {program_names} in {universities}"
                create_comapre_university_prompt = create_compare_programme(programs_st, program_names, universities)
                message = invoke_agent(agent_id, agent_alias_id, session_id, create_comapre_university_prompt)
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                
                return followup(intent_request, response)
    
        elif institutecompare_type == 'School':
            compare_school_aspect = get_slot(intent_request,'CompareSchoolAspectlSlot')
            if compare_school_aspect is None:
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
                
                # message = f"the governorate you selected is: {governorate_name} for the aspect {compare_school_aspect}"
                compare_school_by_governorate_prompt = create_compare_schools_prompt(institute_names=governorate_name, aspect=compare_school_aspect, governorate=True)
                message = invoke_agent(agent_id, agent_alias_id, session_id, compare_school_by_governorate_prompt)
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                
                return followup(intent_request, response)
            
            elif compareschool_type == 'Specific Institutes':
                specific_institutes_name = get_slot(intent_request,'CompareSpecificInstitutesSlot')
                if specific_institutes_name is None:
                    return elicit_slot(
                        intent_request,
                        'CompareSpecificInstitutesSlot',
                        slots=get_slots(intent_request),
                    )
                # message = f"Comparision of Institutes: {specific_institutes_name} for the aspect {compare_school_aspect}"
                compare_schools_prompt = create_compare_schools_prompt(specific_institutes_name, compare_school_aspect)
                message = invoke_agent(agent_id, agent_alias_id, session_id, compare_schools_prompt)
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                
                return followup(intent_request, response)
            
            elif compareschool_type == "All Government Schools" or compareschool_type == 'All Private Schools':
                # message = f"Comparision of schools: {compareschool_type} for the aspect {compare_school_aspect}"
                # compare_schools_prompt = create_compare_schools_prompt(institute_names="", aspect=compare_school_aspect)
                compare_schools_prompt = ""
                if compareschool_type == "All Government Schools":
                    compare_schools_prompt = create_compare_schools_prompt(institute_names="", aspect=compare_school_aspect, all_government=True)
                elif compareschool_type == "All Private Schools":
                    compare_schools_prompt = create_compare_schools_prompt(institute_names="", aspect=compare_school_aspect, all_private=True)
                
                message = invoke_agent(agent_id, agent_alias_id, session_id, compare_schools_prompt)

                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                
                return followup(intent_request, response)
            
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
            # message = f"the vocational training center : {comparevocational_type} choosen for the {comparevocationalaspect} aspect"
            compare_training_center_prompt = create_compare_vocational_training_centres(comparevocational_type, comparevocationalaspect)
            message = invoke_agent(agent_id, agent_alias_id, session_id, compare_training_center_prompt)
            response = create_message(message)
            session_attributes = get_session_attributes(intent_request)
            
            return followup(intent_request, response)
                 
    # Handle OtherIntent
    elif intent_name == 'OtherIntent':
        other_question = get_slot(intent_request, 'OtherQuestionsSlot')
        if not other_question:
            elicit_slot(
                intent_request,
                "OtherQuestionsSlot",
            )
        # response = f"You asked: '{other_question}'. Processing your request."
        response = invoke_agent(agent_id, agent_alias_id, session_id, other_question)
        message = create_message(response)
        return followup(
            intent_request,
            message,
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

