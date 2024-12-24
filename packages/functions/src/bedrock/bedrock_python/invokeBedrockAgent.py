from botocore.exceptions import ClientError
import boto3

def invoke_agent(agent_id, agent_alias_id, session_id, prompt):
    client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")
    try:
        response = client.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=prompt,
            )
        completion = ""

        for event in response.get("completion"):
            chunk = event["chunk"]
            completion = completion + chunk["bytes"].decode()

    except ClientError as e:
        print(e)

    return completion