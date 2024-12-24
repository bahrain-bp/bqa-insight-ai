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
    
    # Get Bedrock ageant id and alias id
    agent_id = os.getenv("agentId")
    agent_alias_id = os.getenv("agentAliasId")

    llama_agent_id = os.getenv("llamaAgentId")
    llama_agent_alias_id = os.getenv("llamaAgentAliasId")

    llama_agent_alias_id = os.getenv("llamaAgentAliasId")
    knowledgeBase = os.getenv("KNOWLEDGEBASE_ID")

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
             school = get_slot(intent_request, "AnalyzeSchoolSlot")
             if school is None:
                return elicit_slot(
                    intent_request,
                    'AnalyzeSchoolSlot',
                    slots=get_slots(intent_request)
                ) 
             schoolaspect = get_slot(intent_request, "SchoolAspectSlot")
             if schoolaspect is None:
                  return elicit_slot(
                    intent_request,
                    'SchoolAspectSlot',
                    slots=get_slots(intent_request)
                ) 
            #  message = f"the school : {school} choosen for the {schoolaspect} aspect"
             analyze_school_prompt = create_analyze_prompt(school, schoolaspect)
             message = invoke_agent(agent_id, agent_alias_id, "123", analyze_school_prompt)
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
             vocational = get_slot(intent_request, "AnalyzeVocationalSlot")
             if vocational is None:
                return elicit_slot(
                    intent_request,
                    'AnalyzeVocationalSlot',
                    slots=get_slots(intent_request)
                ) 
             vocationalaspect = get_slot(intent_request, "VocationalAspectSlot")
             if vocationalaspect is None:
                  return elicit_slot(
                    intent_request,
                    'VocationalAspectSlot',
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
            if analysis_type == 'Program':
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

                # message = f"Put hte damn response here bro: {program_name} {standard}"
                analyze_Uni_prompt = create_uni_analyze_prompt(program_name, standard)
                message = invoke_agent(agent_id, agent_alias_id, "1234", analyze_Uni_prompt)
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
            compare_type = get_slot(intent_request,'CompareUniversitySlot')
            if not compare_type:
                  return elicit_slot(
                intent_request,
                'CompareUniversitySlot',
                slots=get_slots(intent_request),
            )


            if compare_type == 'Universities':
                Uni_name = get_slot(intent_request,'CompareUniversityWUniSlot')
                if Uni_name is None:
                    return elicit_slot(
                        intent_request,
                        'CompareUniversityWUniSlot',
                        slots=get_slots(intent_request),
                    )

                message = f"the universities are: {Uni_name}"
                response = create_message(message)
                session_attributes = get_session_attributes(intent_request)
                session_attributes['chartData'] = "put chart data here "
                return close(
                    intent_request,
                    'Fulfilled',
                    response,
                    session_attributes,
                )
        
            elif compare_type == 'Programs':
                programs_names = get_slot(intent_request,'CompareUniversityWProgramsSlot')
                if programs_names is None:
                    return elicit_slot(
                        intent_request,
                        'CompareUniversityWProgramsSlot',
                        slots=get_slots(intent_request),
                    )
        
                message = f"the programs are: {programs_names}"
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
            compareschool_type = get_slot(intent_request,'CompareSchoolSlot')
            if compareschool_type is None:
                return elicit_slot(
                    intent_request,
                    'CompareSchoolSlot',
                    slots=get_slots(intent_request),
                )  
            
            if compareschool_type == 'Governorate':
                governorate_name = get_slot(intent_request,'GovernorateSlot')
                if governorate_name is None:
                    return elicit_slot(
                        intent_request,
                        'GovernorateSlot',
                        slots=get_slots(intent_request),
                    )
                message = f"the governorate you selected is: {governorate_name}"
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
                message = f"Comparision of Institutes: {specificInstitutes_name}"
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
                message = f"Comparision of schools: {compareschool_type}"
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
            comparevocational_type = get_slot(intent_request,'CompareVocationalSlot')
            if comparevocational_type is None:
                return elicit_slot(
                    intent_request,
                    'CompareVocationalSlot',
                    slots=get_slots(intent_request),
                )  
            comparevocationalaspect = get_slot(intent_request, "CompareVocationalaspectSlot")
            if comparevocationalaspect is None:
                  return elicit_slot(
                    intent_request,
                    'CompareVocationalaspectSlot',
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

