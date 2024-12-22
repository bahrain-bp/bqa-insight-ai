import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Function } from "sst/constructs";
import * as stepFunctionsTasks from "aws-cdk-lib/aws-stepfunctions-tasks";

export const stepFunctions = async() => {
    
    
    // const processJob = new stepFunctionsTasks.LambdaInvoke(
    // this,
    // "state-machine-process-job-fn", {
    //     lambdaFunction: lambdaFunction,
    // }
    // );

}


// const mockLambdaFunctionArn =
//   "arn:aws:lambda:us-east-1:12345:function:my-shiny-lambda-function";
// const mockDdbTableArn =
//   "arn:aws:dynamodb:us-east-1:12345:table/my-shiny-dynamodb-table";