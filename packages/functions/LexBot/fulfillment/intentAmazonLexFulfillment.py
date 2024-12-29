import json
import random
import decimal 

def random_num():
    return(decimal.Decimal(random.randrange(1000, 50000))/100)

def get_slots(intent_request):
    return intent_request['sessionState']['intent']['slots']
    
def get_slot(intent_request, slotName):
    slots = get_slots(intent_request)
    if slots is not None and slotName in slots and slots[slotName] is not None:
        return slots[slotName]['value']['interpretedValue']
    else:
        return None    

def get_session_attributes(intent_request):
    sessionState = intent_request['sessionState']
    if 'sessionAttributes' in sessionState:
        return sessionState['sessionAttributes']

    return {}

def elicit_intent(intent_request, session_attributes, message):
    return {
        'sessionState': {
            'dialogAction': {
                'type': 'ElicitIntent'
            },
            'sessionAttributes': session_attributes
        },
        'messages': [ message ] if message != None else None,
        'requestAttributes': intent_request['requestAttributes'] if 'requestAttributes' in intent_request else None
    }


def close(intent_request, session_attributes, fulfillment_state, message):
    intent_request['sessionState']['intent']['state'] = fulfillment_state
    return {
        'sessionState': {
            'sessionAttributes': session_attributes,
            'dialogAction': {
                'type': 'Close'
            },
            'intent': intent_request['sessionState']['intent']
        },
        'messages': [message],
        'sessionId': intent_request['sessionId'],
        'requestAttributes': intent_request['requestAttributes'] if 'requestAttributes' in intent_request else None
    }


def calculate_solar_panel_estimate(property_size, location, electricity_consumption, roof_orientation, roof_type, shading, budget, installation_timeline):
    # Define cost per solar panel based on budget
    if budget == 'Low':
        cost_per_panel = 600  # Adjusted lower cost for low budget
    elif budget == 'Medium':
        cost_per_panel = 800  # Adjusted medium cost for medium budget
    else:
        cost_per_panel = 1000  # Adjusted higher cost for high budget
    
    # Define production factor based on roof orientation
    if roof_orientation == 'South':
        production_factor = 1.2  # Higher production for south-facing roofs
    elif roof_orientation == 'East':
        production_factor = 1.0  # Average production for east-facing roofs
    else:
        production_factor = 0.8  # Lower production for other orientations
    
    # Define shading factor
    if shading == 'Low':
        shading_factor = 1.1  # Low shading, slightly higher production
    elif shading == 'Medium':
        shading_factor = 0.9  # Medium shading, lower production
    else:
        shading_factor = 0.7  # High shading, much lower production
    
    # Calculate total area of solar panels needed based on property size
    if property_size == 'Small':
        total_area_needed = 40  # Adjusted lower value for small property size
    elif property_size == 'Medium':
        total_area_needed = 80  # Adjusted lower value for medium property size
    else:
        total_area_needed = 120  # Adjusted lower value for large property size
    
    # Calculate total electricity consumption in kWh per month
    if electricity_consumption == 'Low':
        total_electricity_consumption = 300  # Placeholder value for low consumption
    elif electricity_consumption == 'Medium':
        total_electricity_consumption = 500  # Placeholder value for medium consumption
    else:
        total_electricity_consumption = 800  # Placeholder value for high consumption
    
    # Calculate total electricity production per month in kWh
    total_electricity_production = total_area_needed * production_factor * shading_factor * 5  # 5 kWh per square meter per day
    
    # Calculate total electricity savings per year
    total_electricity_savings = (total_electricity_consumption - total_electricity_production) * 12
    
    # Add installation cost factor (percentage of total cost)
    installation_cost_factor = 0.2  # 20% of total cost for installation
    
    # Calculate total cost of solar panels including installation
    total_cost = total_area_needed * cost_per_panel * (1 + installation_cost_factor)
    
    # Calculate ROI in years
    if total_electricity_savings <= 0:
        # Set ROI to a specific value when total electricity savings are non-positive
        roi = float('inf')  # Placeholder value for ROI when savings are less than or equal to 0
    else:
        roi = total_cost / total_electricity_savings
    
    return {
        'total_panels': total_area_needed,
        'cost': total_cost,
        'roi': roi
    }



def GetSolarPanelInstallationEstimateIntent(intent_request):
    session_attributes = get_session_attributes(intent_request)
    
    # Extracting slot values from the event
    slots = get_slots(intent_request)
    
    property_size = get_slot(intent_request, 'PropertySizeSlot')
    location = get_slot(intent_request, 'LocationSlot')
    electricity_consumption = get_slot(intent_request, 'ElectricityConsumptionSlot')
    roof_orientation = get_slot(intent_request, 'RoofOrientationSlot')
    roof_type = get_slot(intent_request, 'RoofTypeSlot')
    shading = get_slot(intent_request, 'ShadingSlot')
    budget = get_slot(intent_request, 'BudgetSlot')
    installation_timeline = get_slot(intent_request, 'InstallationTimelineSlot')
    
    # Calculate solar panel estimate
    estimate = calculate_solar_panel_estimate(property_size, location, electricity_consumption, roof_orientation, roof_type, shading, budget, installation_timeline)
    
    # Construct response text
    text = f"ROI: {estimate['roi']} years, Cost: {estimate['cost']} BD, Solar Panels: {estimate['total_panels']}."

    message = {
        'contentType': 'PlainText',
        'content': text
    }

    fulfillment_State ="Fulfilled"
    # Return the calculated estimate
    return close(intent_request, session_attributes, fulfillment_State, message)


def WelcomeIntent(intent_request):
    # Retrieve session attributes
    session_attributes = get_session_attributes(intent_request)

    # Extracting slot values from the event
    slots = get_slots(intent_request)
    print(slots)
    
    # Get specific slot for SolarMap
    category = get_slot(intent_request, 'SolarMapSlot')

    text = "Recieved Category is not valid. Please choose another category from the provided list."
    # Initialize text variable based on category
    if category == 'About':
        text = "SolarMap is a revolutionary platform that utilizes AI and AWS Ground Station to map and manage solar panel installations across Bahrain, supporting efficient energy policies and sustainable development."
    elif category == 'Providers':
        text = "Providers are categorized into Contractors & Consultants. Contractors can utilize SolarMap to access real-time data and analytics for the precise placement and management of solar installations, ensuring optimal performance and efficiency. Consultants benefit from SolarMap by getting detailed insights and analytics that aid in strategic planning and advising on solar energy projects."
    elif category == 'Calculation':
        text = "SolarMap calculates the optimal number of solar panels and cost estimates based on real-time satellite data, size of the property, and energy consumption details from EWA bills. You can start your calculation process in chat right away using the 'Calculate' or by using the Document or Map Calculator."
    elif category == 'Process':
        text = "The process involves homeowners signing up, submitting EWA bills and house coordinates, and receiving estimates for solar panels. MEWA supervisors review and approve applications on the platform."
    elif category == 'More':
        text = "For more information or to dive deeper into how SolarMap is transforming Bahrain's approach to solar energy, please visit the MEWA website or contact our Renewable Energy Department or reach out to mewa.solarmap@gmail.com for additional inquiries."
    elif category == 'Data & Privacy':
        text = "SolarMap ensures strict adherence to data privacy standards, securely processing and storing all user data and energy consumption details with robust protection measures."

    # Construct the response message
    message = {
        'contentType': 'PlainText',
        'content': text
    }

    fulfillment_State = "Fulfilled"
    
    # Return the calculated estimate
    return close(intent_request, session_attributes, fulfillment_State, message)

def BQAIntent(intent_request):
    session_attributes = get_session_attributes(intent_request)

    text = "This is BQA. What would you like to compare?"
    message = {
        'contentType': 'PlainText',
        'content': text
    }
    fulfillment_State = "Fulfilled"
    return close(intent_request, session_attributes, fulfillment_State, message)

def dispatch(intent_request):
    intent_name = intent_request['sessionState']['intent']['name']
    print(f"Intent is {intent_name}")
    response = None
    # Dispatch to your bot's intent handlers
    if intent_name == 'WelcomeIntent':
        return WelcomeIntent(intent_request)
    elif intent_name == 'GetSolarPanelInstallationEstimateIntent':
        return GetSolarPanelInstallationEstimateIntent(intent_request)
    # elif intent_name == 'FollowupCheckBalance':
    #     return FollowupCheckBalance(intent_request)
    elif intent_name == 'BQAIntent':
        return BQAIntent(intent_request)
    else:
        raise Exception('Intent with name ' + intent_name + ' not supported')

def lambda_handler(event, context):
    response = dispatch(event)
    return response
