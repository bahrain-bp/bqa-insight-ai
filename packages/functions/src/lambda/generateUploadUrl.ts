import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

export async function handler(event: any) {
    const { files } = JSON.parse(event.body); // `files` should be an array of { fileName, fileType }
    console.log("Bucket Name:", process.env.BUCKET_NAME); // Debugging log

    const bucketName = process.env.BUCKET_NAME as string;
    if (!bucketName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Bucket name is not defined in environment variables" }),
        };
    }

    // Array to store upload URLs
    const uploadURLs = [];

    // Generate a pre-signed URL for each file
    for (const file of files) {
        const { fileName, fileType } = file;

        const params = {
            Bucket: bucketName,
            Key: fileName,
            Expires: 60, // URL expiration in seconds
            ContentType: fileType,
        };

        try {
            const uploadURL = await s3.getSignedUrlPromise("putObject", params);
            uploadURLs.push({ fileName, uploadURL });
        } catch (error) {
            console.error("Error generating URL for:", fileName, error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `Failed to generate URL for ${fileName}` }),
            };
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ uploadURLs }), // Return all generated URLs
    };
}
