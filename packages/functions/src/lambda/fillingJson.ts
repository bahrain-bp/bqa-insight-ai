import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

async function insertMetadataFile(bucketName: string, fileKey: string, data: any, type: 'institute' | 'university' | 'program'): Promise<void> {
    const metadataKey = `Text${fileKey}.metadata.json`;

    const metadataContent = JSON.stringify({
        "metadata": type === 'institute' ? {
            "institueName": data["Institute Name"],
            "instituteType": data["Institute Type"],
            "instituteClassification": data["Institute Classification"],
            "instituteGradeLevels": data["Grades In School"],
            "instituteLocation": data["Location"],
            "dateOfReview": data["Date of Review"],
        } : type === 'university' ? {
            "universityName": data["University Name"],
            "location": data["University Location"],
            "numOfPrograms": data["Number Of Programmes"],
            "numOfQualifications": data["Number Of Qualifications"]
        } : {
            "universityName": data["University Name"],
            "programmeName": data["Programme Name"],
            "programmeJudgment": data["Programme Judgment"]
        }
    }, null, 2);

    try {
        await s3.putObject({
            Bucket: bucketName,
            Key: metadataKey,
            Body: metadataContent,
            ContentType: "application/json",
        }).promise();
        console.log(`Metadata file ${metadataKey} created in bucket ${bucketName}`);
    } catch (error) {
        console.error("Error creating metadata file in S3:", error);
    }
}

export async function handleDynamoDbInsert(event: any, bucket: string, fileKey: string, type: 'institute' | 'university' | 'program' = 'institute'): Promise<void> {
    if (!bucket) {
        throw new Error("Bucket name not defined");
    }

    const sanitizedFileKey = fileKey.replace(".pdf", "");
    await insertMetadataFile(bucket, sanitizedFileKey, event, type);
}
