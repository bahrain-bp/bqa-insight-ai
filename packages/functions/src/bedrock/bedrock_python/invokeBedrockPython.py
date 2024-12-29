import os
import boto3
import json

from botocore.exceptions import ClientError

def invokeBedrockPython(metric, name):
    # event_parsed = json.loads(event["body"])
    # prompt = event_parsed["prompt"]
    agentId = os.getenv("agentId")
    agentAliasId = os.getenv("agentAliasId")
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