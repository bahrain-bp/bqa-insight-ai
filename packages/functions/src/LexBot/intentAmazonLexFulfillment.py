# --- Helpers that build all of the responses ---

import json
import os

from Bedrock_Lex.invokeBedrockAgent import invoke_agent
from Bedrock_Lex.prompts import *

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
    if slot_string is None or slot_string == "":
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
        if 'slotHistory' in session_attributes:
            session_attributes.pop('slotHistory')
        return
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
    session_attributes['retry'] = 'false'

    # remove last slot
    last_slot = slot_list.pop()
    set_slot_history(slot_list, session_attributes)

    if len(slot_list) == 0:
        return elicit_intent(
            intent_request,
            "BQASlot",
            "BQAIntent",
        )
    # get slots from session_attributes if they exist
    WAS_FOLLOWUP = 'slots' in session_attributes and 'OtherQuestionsSlot' in last_slot
    if WAS_FOLLOWUP:
        intent_request['sessionState']['intent']['slots'] = json.loads(session_attributes['slots'])
        session_attributes.pop('slots')
    else:
        intent_request['sessionState']['intent']['slots'].pop(last_slot[1])
    current_intent = last_slot[0]
    # get last slot, this will be reset
    last_slot = slot_list[-1]
    print("The last item is ", last_slot)
    print("The array is ", slot_list)

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

def invoke_bedrock(intent_request, prompt):
    print("Invoking bedrock with prompt: ", prompt)
    # Get Bedrock ageant id and alias id
    agent_id = os.getenv("agentId")
    agent_alias_id = os.getenv("agentAliasId")
    session_id = intent_request['sessionId']

    message = invoke_agent(agent_id, agent_alias_id, session_id, prompt)
    response = create_message(message)
    return followup(intent_request, response)

class Step:
    def __init__(self, name: str="", options_slot: str="", options=(), required_slots=(), callback=None) -> None:
        self.name = name
        self.options_slot = options_slot
        for option in options:
            assert isinstance(option, Step)
        self.options = options
        self.required_slots = required_slots
        self.callback = callback

    def process_step(self, intent_request):
        # collect required slots for the callback later
        slots = {}
        for slot_name in self.required_slots:
            slot_value = get_slot(intent_request, slot_name)
            if not slot_value:
                return elicit_slot(
                    intent_request,
                    slot_name,
                    slots=get_slots(intent_request),
                )
            slots[slot_name] = slot_value
        print("Required slots: ", slots)

        # process the options if they exist
        if self.options_slot != "":
            print(f"Processing step for {self.options_slot} with name {self.name}")
            slot_value = get_slot(intent_request, self.options_slot)
            if not slot_value:
                print(f"Did not find slot {self.options_slot}, eliciting")
                return elicit_slot(
                    intent_request,
                    self.options_slot,
                    slots=get_slots(intent_request),
                )

            print("Checking options: ", self.options)
            for option in self.options:
                if slot_value == option.name:
                    return option.process_step(intent_request)

        # execute callback with required slots
        if self.callback is not None:
            print("No options, doing callback")
            response = invoke_bedrock(intent_request, self.callback(slots))
            print("Callback response: ", response)
            return response
        # if no returns, failed
        print("Nothing :(")
        raise Exception("Fulfillment failed.")

    def __repr__(self) -> str:
        return f"{self.name} for slot ({self.options_slot}) with options ({self.options}) and required slots ({self.required_slots})"

def dispatch(intent_request):

    response = None
    intent_name = intent_request['sessionState']['intent']['name']
    returnToMenu = get_session_attributes(intent_request).get('return')
    retrySlots = get_session_attributes(intent_request).get('retry')

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

    # Handle BQAIntent
    if intent_name == 'BQAIntent':
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
        step = Step(
            'Analyze',
            options_slot='InstituteTypeSlot',
            options=(
                Step(
                    'School',
                    required_slots=(
                        'SchoolAspectSlot',
                        'AnalyzeSchoolSlot',
                    ),
                    callback=lambda slots: create_school_analyze_prompt(slots['AnalyzeSchoolSlot'], slots['SchoolAspectSlot'])
                ),
                Step(
                    'Vocational Training Center',
                    required_slots=(
                        'VocationalAspectSlot',
                        'AnalyzeVocationalSlot',
                    ),
                    callback=lambda slots: create_analyze_vocational_training_centre(slots['AnalyzeVocationalSlot'], slots['VocationalAspectSlot'])
                ),
                Step(
                    'University',
                    options_slot='AnalyzeUniversitySlot',
                    options=(
                        Step(
                            'Program Review',
                            required_slots=(
                                'ProgramNameSlot',
                                'StandardProgSlot',
                                'UniNameSlot',
                            ),
                            callback=lambda slots: create_uni_analyze_prompt(slots['StandardProgSlot'], slots['UniNameSlot'], slots['ProgramNameSlot'])
                        ),
                        Step(
                            'Institutional Review',
                            required_slots=(
                                'StandardSlot',
                                'AnalyzeUniversityNameSlot',
                            ),
                            callback=lambda slots: create_uni_analyze_prompt(slots['StandardSlot'], slots['AnalyzeUniversityNameSlot'])
                        ),
                    )
                ),
            )
        )
        return step.process_step(intent_request)
    # Handle ComparingIntent
    elif intent_name == 'ComparingIntent':
        step =  Step(
            'Compare',
            options_slot='InstituteCompareTypeSlot',
            options=(
                Step(
                    'University',
                    options_slot='CompareUniversitySlot',
                    options=(
                        Step(
                            'Institutes',
                            required_slots=(
                                'CompareUniStandardSlot',
                                'CompareUniversityUniSlot',
                            ),
                            callback=lambda slots: create_compare_uni_prompt(slots['CompareUniversityUniSlot'], slots['CompareUniStandardSlot'])
                        ),
                        Step(
                            'Programs',
                            required_slots=(
                                'CompareUniversityWProgramsSlot',
                                'CompareUniversityWprogSlot',
                                'CompareUniversityWprogUniversityNameSlot',
                            ),
                            callback=lambda slots: create_compare_programme(slots['CompareUniversityWProgramsSlot'], slots['CompareUniversityWprogSlot'], slots['CompareUniversityWprogUniversityNameSlot'])
                        ),
                    )
                ),
                Step(
                    'School',
                    required_slots=(
                        'CompareSchoolAspectlSlot',
                    ),
                    options_slot='CompareSchoolSlot',
                    options=(
                        Step(
                            'Governorate',
                            required_slots=(
                                'CompareSchoolAspectlSlot',
                                'GovernorateSlot',
                            ),
                            callback=lambda slots: create_compare_schools_prompt(slots['GovernorateSlot'], slots['CompareSchoolAspectlSlot'], governorate=True)
                        ),
                        Step(
                            'Specific Institutes',
                            required_slots=(
                                'CompareSchoolAspectlSlot',
                                'CompareSpecificInstitutesSlot',
                            ),
                            callback=lambda slots: create_compare_schools_prompt(slots['CompareSpecificInstitutesSlot'], slots['CompareSchoolAspectlSlot'])
                        ),
                        Step(
                            'All Government Schools',
                            required_slots=(
                                'CompareSchoolAspectlSlot',
                            ),
                            callback=lambda slots: create_compare_schools_prompt("", slots['CompareSchoolAspectlSlot'], all_government=True)
                        ),
                        Step(
                            'All Private Schools',
                            required_slots=(
                                'CompareSchoolAspectlSlot',
                            ),
                            callback=lambda slots: create_compare_schools_prompt("", slots['CompareSchoolAspectlSlot'], all_private=True)
                        ),
                    )
                ),
                Step(
                    'Vocational Training Center',
                    required_slots=(
                        'CompareVocationalaspectSlot',
                        'CompareVocationalSlot',
                    ),
                    callback=lambda slots: create_compare_vocational_training_centres(slots['CompareVocationalSlot'], slots['CompareVocationalaspectSlot'])
                ),
            )
        )

        return step.process_step(intent_request)
    # Handle OtherIntent
    elif intent_name == 'OtherIntent':
        step = Step(
            'Other',
            required_slots=(
                'OtherQuestionsSlot',
            ),
            callback=lambda slots: slots['OtherQuestionsSlot'],
        )

        return step.process_step(intent_request)

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

