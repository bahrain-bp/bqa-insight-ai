import boto3
import pdfplumber
from io import BytesIO
import json

# Initialize S3 client
s3 = boto3.client('s3')

def extract_text_from_pdf(bucket_name: str, file_key: str) -> str:
    try:
        # Get the file directly from S3
        s3_object = s3.get_object(Bucket=bucket_name, Key=file_key)
        pdf_data = s3_object['Body'].read()
        
        # Open the PDF using pdfplumber
        with pdfplumber.open(BytesIO(pdf_data)) as pdf:
            full_text = ""
            for page in pdf.pages:
                full_text += page.extract_text() + "\n"  # Extract text from each page
            
            return full_text.strip()  # Return the extracted text

    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def lambda_handler(event, context):
    # Log the event to see the structure
    print(json.dumps(event))

    # Extract bucket name and file key from the event
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    file_key = event['Records'][0]['s3']['object']['key']

    print(f"Processing file from bucket: {bucket_name}, key: {file_key}")

    # Extract text from the provided PDF file in the S3 bucket
    text = extract_text_from_pdf(bucket_name, file_key)

    # If extraction was successful, log the extracted text
    if text:
        print("Extracted Text: ")
        print(text)
    else:
        print("Failed to extract text from PDF.")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Text extraction completed.',
            'bucket': bucket_name,
            'file': file_key,
            'status': 'success' if text else 'failure'
        })
    }
