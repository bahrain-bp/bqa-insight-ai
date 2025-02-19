from botocore.exceptions import ClientError
import boto3
# Function to invoke agent for lex
def invoke_agent(agent_id, agent_alias_id, session_id, prompt):
    # initalize the client
    client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")
    completion = ""
    # sending the request
    try:
        response = client.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=prompt,
            )
    # decoding the request
        for event in response.get("completion"):
            chunk = event["chunk"]
            completion = completion + chunk["bytes"].decode()
    # catching errors, especially throttling request error because of the limit
    except ClientError as e:
        print("Error when invoking bedrock: ", e)
        print("Error response: ", e.response)
        print("Error code: ", e.response['Error']['Code'])
        if e.response['Error']['Code'] == 'throttlingException':
            print("caught error ")
            completion = "Too many requests. Try again in a few minutes."

    return completion
