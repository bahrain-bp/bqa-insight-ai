import * as AWS from "aws-sdk";

// Initialize AWS SDK services
const s3 = new AWS.S3();

async function insertMetadataFile(bucketName: string, fileKey: string, data: any): Promise<void> {
    // Define the path to store the metadata file inside the TextFiles folder
    const metadataKey = `Text${fileKey}.metadata.json`;

    // Format the metadata to be compatible with Amazon Bedrock (Metadata filtering)
    const metadataContent = JSON.stringify({
        "metadata": {
            "institueName": data["Institute Name"],
            "instituteType": data["Institute Type"],
            "instituteClassification": data["Institute Classification"],
            "instituteGradeLevels": data["Grades In School"],
            "instituteLocation": data["Location"],
            "dateOfReview": data["Date of Review"],
        }
    }, null, 2);

    try {
        // Upload the formatted metadata to S3
        await s3.putObject({
            Bucket: bucketName,
            Key: metadataKey, // Store in TextFiles folder
            Body: metadataContent,
            ContentType: "application/json",
        }).promise();

        console.log(`Metadata file ${metadataKey} successfully created in bucket ${bucketName}.`);
    } catch (error) {
        console.error("Error creating metadata file in S3:", error);
    }
}

// Lambda function handler to process DynamoDB Stream event
export async function handleDynamoDbInsert(event: any, bucket: string, fileKey: string): Promise<void> {
    const bucketName = bucket;
    if (!bucketName) {
        throw new Error("Bucket name is not defined. Please set the BUCKET_NAME environment variable.");
    }

    // Remove .pdf extension from fileKey using replace
    const sanitizedFileKey = fileKey.replace(".pdf", "");

    console.log("Sanitized File Key:", sanitizedFileKey);
    console.log("Bucket Name:", bucketName);
    console.log("This is the event:", event);

    // Call the function to insert metadata into S3
    await insertMetadataFile(bucketName, sanitizedFileKey, event);
}
