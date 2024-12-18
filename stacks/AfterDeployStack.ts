import { Script, StackContext, dependsOn, use } from "sst/constructs";
import { S3Stack } from "./S3Stack";
import { Duration, aws_lambda as lambda } from "aws-cdk-lib";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";

export function AfterDeployStack({stack}: StackContext) {

    const {bucket, splitFunction} =  use(S3Stack);
    // dependsOn(S3Stack);

    const script = new Script(stack, "S3AfterStack", {
        defaults: {
            function: { 
                timeout: 60,
                environment: {
                    bucketName: bucket.bucketName,
                    functionArn: splitFunction.functionArn
                },
                permissions: ["s3", "lambda", "s3:PutBucketNotificationConfiguration"]
            }
        },
        onCreate: "packages/functions/src/applyBucketNotification.putBucketNotification",
        onUpdate: "packages/functions/src/applyBucketNotification.putBucketNotification",
        
    });

    

    const applyBucketNotificationSyncFunction = new lambda.Function(stack, "applyBucketNotificationSyncFunction", {
        functionName: stack.stage + "-applyBucketNotificationSyncFunction",
        handler: "applyBucketNotification.putBucketNotification",
        runtime: lambda.Runtime.NODEJS_20_X,        
        timeout: Duration.seconds(60),
        code: lambda.Code.fromAsset("packages/functions/src/")
    })

    applyBucketNotificationSyncFunction.grantInvoke(new ServicePrincipal("s3.amazonaws.com"));
    applyBucketNotificationSyncFunction.addPermission("s3SendMessageNotificationPermission", {
        action: "lambda:InvokeFunction",
        principal: new ServicePrincipal("s3.amazonaws.com")
    })
    
}
// packages/functions/src/applyBucketNotification

function createLambdaPermission() {
    const lambda = new AWS.Lambda();
  
    const params = {
      Action:        'lambda:InvokeFunction',
      FunctionName:  process.env.functionArn || "",
      Principal:     's3.amazonaws.com',
    //   SourceAccount: ,
      StatementId:   `example-S3-permission`,
    };
  
    lambda.addPermission(params, function (err: any, data: any) {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });
  }