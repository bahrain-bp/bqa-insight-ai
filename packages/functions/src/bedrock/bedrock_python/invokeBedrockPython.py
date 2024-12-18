# import boto3
# import json

# from botocore.exceptions import ClientError

# def invokeBedrockPython(metric, name):
#     # event_parsed = json.loads(event["body"])
#     # prompt = event_parsed["prompt"]

#     prompt = "hello, what are these"

#     client = boto3.client("bedrock-runtime", region_name="us-east-1")
#     model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

#     native_request = {
#         "anthropic_version": "bedrock-2023-05-31",
#         "max_tokens": 512,
#         "temperature": 0.5,
#         "messages": [
#             {
#                 "role": "user",
#                 "content": [{"type": "text", "text": prompt}],
#             }
#         ],
#     }

#     request = json.dumps(native_request)

#     try:
#     # Invoke the model with the request.
#         response = client.invoke_model(modelId=model_id, body=request)

#     except (ClientError, Exception) as e:
#         print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
#         exit(1)

#     # Decode the response body.
#     model_response = json.loads(response["body"].read())

#     # Extract and print the response text.
#     response_text = model_response["content"][0]["text"]
#     return response_text
#     # return json.dumps({
#     #     "statusCode": 200,
#     #     "output": response_text
#     # })