import { 
    CognitoIdentityProviderClient, 
    AdminCreateUserCommand, 
    AdminSetUserPasswordCommand, 
    ListUsersCommand 
  } from "@aws-sdk/client-cognito-identity-provider";
  import { APIGatewayProxyHandlerV2 } from "aws-lambda";
  import * as uuid from "uuid";
  
  const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" });
  const userPoolId = "us-east-1_3q7TXdnTh";
  
  export const createUserInCognito: APIGatewayProxyHandlerV2 = async (event) => {
    try {
      const { email, tempPassword, name } = JSON.parse(event.body || "{}");
  
      if (!email || !tempPassword || !name) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing required fields: email, name, or password." }),
        };
      }
  
      // Check if the email already exists
      const emailCheckParams = { UserPoolId: userPoolId, Filter: `email = "${email}"` };
      const emailCheckResponse = await cognitoClient.send(new ListUsersCommand(emailCheckParams));
  
      if (emailCheckResponse.Users?.length) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Email already exists." }),
        };
      }
  
      // Create user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: tempPassword,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: name },
        ],
      });
  
      await cognitoClient.send(createUserCommand);
  
      // Set the password as permanent
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: tempPassword,
        Permanent: true,
      });
  
      await cognitoClient.send(setPasswordCommand);
  
      return {
        statusCode: 201,
        body: JSON.stringify({ message: "User created successfully." }),
      };
  
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal server error.",}),
      };
    }
  };
  