import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

export async function handler(event: any) {
    const { fileName, fileType } = JSON.parse(event.body);
    console.log("Bucket Name:", process.env.BUCKET_NAME); // Debugging log

    const bucketName = process.env.BUCKET_NAME as string;
    if (!bucketName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Bucket name is not defined in environment variables" }),
        };
    }

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Expires: 60, // URL expiration in seconds
        ContentType: fileType,
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);

    return {
        statusCode: 200,
        body: JSON.stringify({ uploadURL }),
    };
}
