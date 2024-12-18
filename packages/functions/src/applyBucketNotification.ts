import { APIGatewayEvent } from "aws-lambda";
import {S3Client, PutBucketNotificationConfigurationCommand, PutBucketNotificationConfigurationCommandInput} from '@aws-sdk/client-s3';

export async function putBucketNotification() {
    console.log("Bucket name and type: ", process.env.bucketName, typeof process.env.bucketName);
    console.log("Function name and type: ", process.env.functionArn, typeof process.env.functionArn);
    const client = new S3Client();

    const input: PutBucketNotificationConfigurationCommandInput = {

        Bucket: process.env.bucketName,
        NotificationConfiguration: {
            LambdaFunctionConfigurations: [
                {
                    LambdaFunctionArn: process.env.functionArn,
                    Events: [
                        "s3:ObjectCreated:*"
                    ],
                    Filter: {
                        Key: {
                            FilterRules: [
                                {
                                    Name: "prefix",
                                    Value: "Files/"
                                },
                                {
                                    Name: "suffix",
                                    Value: ".pdf"
                                }
                            ]
                        }
                    }
                }
            ]
        },
        // SkipDestinationValidation: true
    }

    const command = new PutBucketNotificationConfigurationCommand(input);
    const response = await client.send(command);

    console.log("Apply Bucket Notification response: ", response)


}