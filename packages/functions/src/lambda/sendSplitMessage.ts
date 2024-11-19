import * as AWS from "aws-sdk";

const sqs = new AWS.SQS();

export async function handler(event: any) {
    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const fileKey = record.s3.object.key;

        const messageBody = JSON.stringify({
            bucketName,
            fileKey,
        });

        console.log(`Sending message to SQS: ${messageBody}`);

        try {
            await sqs
                .sendMessage({
                    QueueUrl: process.env.SQS_QUEUE_URL!,
                    MessageBody: messageBody,
                })
                .promise();

            console.log(`Message sent for file: ${fileKey}`);
        } catch (error) {
            console.error(`Error sending message to SQS for file ${fileKey}:`, error);
        }
    }
}
