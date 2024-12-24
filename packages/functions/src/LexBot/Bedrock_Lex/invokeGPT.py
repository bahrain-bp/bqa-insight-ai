import os
from openai import OpenAI

def invoke_Gpt(prompt):
    try:
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        
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
