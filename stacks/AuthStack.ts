import { Api, Cognito, StackContext, StaticSite } from "sst/constructs";

export function AuthStack({ stack, app }: StackContext) {
  // Create User Pool
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
  });
return{auth};
}