# Define your SSO profile details
$AWS_PROFILE = "BPCTeam1_AWSAdministratorAccess"  # The name of your SSO profile
$SSO_START_URL = "https://bp-cic.awsapps.com/start/"
$SSO_REGION = "us-east-1"
$ACCOUNT_ID = "588738578192"
$ROLE_NAME = "AWSAdministratorAccess"
$DEFAULT_REGION = "us-east-1"

# Open the SSO login page in the default web browser
Start-Process $SSO_START_URL
Write-Output "Please log in and copy the credentials to the clipboard."

# Wait for the user to copy credentials to the clipboard
Write-Output "Press Enter once you've copied the credentials to the clipboard..."
[void][System.Console]::ReadLine()

# Retrieve the clipboard content
try {
    $clipboardContent = Get-Clipboard
    Write-Output "Clipboard content retrieved successfully."
} catch {
    Write-Output "Failed to retrieve clipboard content. Ensure you have copied the credentials."
    exit
}

# Parse the clipboard content (assuming the format is similar to AWS CLI environment variables)
# Example format in clipboard:
# AWS_ACCESS_KEY_ID=ASIAYSE4NY4IHGKRBCEI
# AWS_SECRET_ACCESS_KEY=+UcTdCfOoW0YoYTU1DHeb8K0orD7T6X+zDl2kp/J
# AWS_SESSION_TOKEN=IqOjb3Jp2ZluX2vjEEaACXzVLWhc3QtMSgMGEQCfHkwXSfKf18Ra86gFCQY2QxVDTCM0L3RZPmTqJw

$awsAccessKeyId = ""
$awsSecretAccessKey = ""
$awsSessionToken = ""

foreach ($line in $clipboardContent -split "`n") {
    if ($line -match "^AWS_ACCESS_KEY_ID=(.+)$") {
        $awsAccessKeyId = $matches[1].Trim()
    }
    elseif ($line -match "^AWS_SECRET_ACCESS_KEY=(.+)$") {
        $awsSecretAccessKey = $matches[1].Trim()
    }
    elseif ($line -match "^AWS_SESSION_TOKEN=(.+)$") {
        $awsSessionToken = $matches[1].Trim()
    }
}

if (-not ($awsAccessKeyId -and $awsSecretAccessKey -and $awsSessionToken)) {
    Write-Output "Failed to parse clipboard content. Ensure it contains AWS credentials."
    exit
}

# Path to AWS credentials file
$credentialsPath = [System.IO.Path]::Combine($HOME, ".aws", "credentials")

# Construct the credentials content for the default profile
$credentialsContent = @"
[default]
aws_access_key_id = $awsAccessKeyId
aws_secret_access_key = $awsSecretAccessKey
aws_session_token = $awsSessionToken
"@

# Write the credentials to the AWS credentials file
Set-Content -Path $credentialsPath -Value $credentialsContent
Write-Output "AWS credentials updated successfully in ~/.aws/credentials for the default profile."
