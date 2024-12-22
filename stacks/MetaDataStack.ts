import { StackContext, Function } from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import * as stepFunctionsTasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as stepFunctions from "aws-cdk-lib/aws-stepfunctions";
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { SFNClient } from "@aws-sdk/client-sfn";


export function MetadataStack({ stack }: StackContext) {
    const sfn = new SFNClient();
    const model = bedrock.FoundationModel.fromFoundationModelId(
        stack,
        'Model',
        bedrock.FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_SONNET_20240229_V1_0,
      );

    const claudeUniversityMetadataFunction = new lambda.Function(stack, "claudeUniversityMetadataFunction", {
        handler: "ClaudeUniversityMetadata.handler",
        code: lambda.Code.fromAsset("packages/functions/src/bedrock/"),
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(300)
    })

    const claudeExtractReportMetadataFunction = new lambda.Function(stack, "claudeExtractReportMetadata", {
        handler: "claudeExtractReportMetadata.handler",
        code: lambda.Code.fromAsset("packages/functions/src/bedrock/"),
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(300)
    })

    
    const FileTypeFunction = new lambda.Function(stack, "FileType", {
        handler: "checkFileType.handler",
        code: lambda.Code.fromAsset("packages/functions/src/bedrock/"),
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(300)
    })

    const processJob = new stepFunctionsTasks.LambdaInvoke(
        stack,
        "state-machine-process-job-fn", {
            lambdaFunction: FileTypeFunction,
        }
    );

    const wait10MinsTask = new stepFunctions.Wait(
        stack,
        "state-machine-wait-job", {
          time: stepFunctions.WaitTime.duration(Duration.minutes(10)),
        }
    );

    // const ddbWrite = new stepFunctionsTasks.BedrockInvokeModel(
    //     stack,
    //     "ddb-write-job", {
    //       model: model,
    //       body: sfn.TaskInput.fromObject(
    //         {
    //           inputText: 'Generate a list of five first names.',
    //           textGenerationConfig: {
    //             maxTokenCount: 100,
    //             temperature: 1,
    //           },
    //         },
    //       ),
    //       resultSelector: {
    //         names: sfn.JsonPath.stringAt('$.Body.results[0].outputText'),
    //       },
    //     }
    //   );

    // use the output of fn as input
    const callLambda = new stepFunctionsTasks.LambdaInvoke(stack, 'Invoke with payload field in the state input', {
        lambdaFunction: FileTypeFunction,
        // payload: stepFunctions.TaskInput.fromJsonPathAt('$.Payload'),
    });

    const stateMachineDefinition = processJob
    .next(wait10MinsTask)
    .next(callLambda);

    const stateMachine = new stepFunctions.StateMachine(stack, "state-machine", {
    definitionBody: stepFunctions.DefinitionBody.fromChainable(
        stateMachineDefinition
    ),
    timeout: Duration.minutes(5),
    stateMachineName: "ProcessAndReportJob",
    });

    return {claudeUniversityMetadataFunction, claudeExtractReportMetadataFunction, FileTypeFunction}
}