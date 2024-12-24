from openai import OpenAI

def invoke_Gpt(prompt):
    try:
        client = OpenAI(
            api_key="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"
        )
        
        completion = client.chat.completions.create(
            model="gpt-4",  # or whichever model you prefer
            messages=[
                {"role": "user", "content": prompt}
            ],
            stream=True  # Keep streaming if you want to process chunks like in original code
        )
        
        response_text = ""
        for chunk in completion:
            if chunk.choices[0].delta.content is not None:
                response_text += chunk.choices[0].delta.content
                
        return response_text
        
    except Exception as e:
        print(f"Error: {e}")
        return None
