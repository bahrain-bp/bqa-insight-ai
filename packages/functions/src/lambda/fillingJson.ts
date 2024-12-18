const s3 = new AWS.S3();
// Function to insert the empty metadata.json file into S3
async function insertMetadataFile(bucketName: string, fileKey: string): Promise<void> {
    const metadataKey = `${fileKey}.metadata.json`;

    // Create an empty JSON object for now
    const metadataContent = JSON.stringify({});

    await s3.putObject({
        Bucket: bucketName,
        Key: metadataKey,
        Body: metadataContent,
        ContentType: "application/json",
    }).promise();
}