#!/bin/bash

# Define your SSO profile details
AWS_PROFILE="BPCTeam1_AWSAdministratorAccess"  # The name of your SSO profile
SSO_START_URL="https://bp-cic.awsapps.com/start/"
SSO_REGION="us-east-1"
ACCOUNT_ID="588738578192"
ROLE_NAME="AWSAdministratorAccess"
DEFAULT_REGION="us-east-1"

# Open the SSO login page in the default browser
echo "Opening SSO login page..."
xdg-open "$SSO_START_URL" 2>/dev/null || open "$SSO_START_URL" 2>/dev/null || start "$SSO_START_URL"

# Prompt the user to copy the credentials to the clipboard
echo "Please log in and copy the credentials to your clipboard."
read -p "Press Enter once you've copied the credentials to the clipboard..."

# Retrieve the clipboard content
clipboard_content=$(xclip -o -selection clipboard 2>/dev/null || pbpaste 2>/dev/null)

# Check if clipboard content was retrieved
if [ -z "$clipboard_content" ]; then
  echo "Failed to retrieve clipboard content. Ensure you have copied the credentials."
  exit 1
fi

echo "Clipboard content retrieved successfully."

# Initialize variables to store credentials
aws_access_key_id=""
aws_secret_access_key=""
aws_session_token=""

# Parse the clipboard content (expecting format similar to environment variables)
# Example format in clipboard:
# AWS_ACCESS_KEY_ID=ASIAYSE4NY4IHGKRBCEI
# AWS_SECRET_ACCESS_KEY=+UcTdCfOoW0YoYTU1DHeb8K0orD7T6X+zDl2kp/J
# AWS_SESSION_TOKEN=IqOjb3Jp2ZluX2vjEEaACXzVLWhc3QtMSgMGEQCfHkwXSfKf18Ra86gFCQY2QxVDTCM0L3RZPmTqJw

while IFS= read -r line; do
  if [[ $line =~ ^AWS_ACCESS_KEY_ID=(.+)$ ]]; then
    aws_access_key_id="${BASH_REMATCH[1]}"
  elif [[ $line =~ ^AWS_SECRET_ACCESS_KEY=(.+)$ ]]; then
    aws_secret_access_key="${BASH_REMATCH[1]}"
  elif [[ $line =~ ^AWS_SESSION_TOKEN=(.+)$ ]]; then
    aws_session_token="${BASH_REMATCH[1]}"
  fi
done <<< "$clipboard_content"

# Verify that all required variables are set
if [ -z "$aws_access_key_id" ] || [ -z "$aws_secret_access_key" ] || [ -z "$aws_session_token" ]; then
  echo "Failed to parse clipboard content. Ensure it contains AWS credentials in the expected format."
  exit 1
fi

# Define the path to the AWS credentials file
credentials_path="$HOME/.aws/credentials"

# Create the credentials content for the default profile
credentials_content="[default]
aws_access_key_id = $aws_access_key_id
aws_secret_access_key = $aws_secret_access_key
aws_session_token = $aws_session_token
"

# Write the credentials to the AWS credentials file
echo "$credentials_content" > "$credentials_path"
echo "AWS credentials updated successfully in ~/.aws/credentials for the default profile."
