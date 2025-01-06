// Import necessary SST constructs for managing authentication and resources
import { Api, Cognito, StackContext, StaticSite } from "sst/constructs";

// Define the AuthStack function which creates the authentication stack
export function AuthStack({ stack, app }: StackContext) {
  // Create Cognito User Pool for user authentication
  const auth = new Cognito(stack, "Auth", {
    // Define login mechanism (email-based login)
    login: ["email"],

    // Use CDK (Cloud Development Kit) properties for user pool configuration
    cdk: {
      userPool: {
        // Enable self-sign up for users (users can register themselves)
        selfSignUpEnabled: true,
        // Automatically verify the email address upon registration
        autoVerify: { email: true },
      },
    },
  });

  // Return the created 'auth' object to be used in other parts of the application
  return { auth };
}
