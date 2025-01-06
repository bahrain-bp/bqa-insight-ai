import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

//Inserts a metadata file into an S3 bucket 
async function insertMetadataFile(
    bucketName: string, 
    fileKey: string, 
    data: any, 
    type: 'institute' | 'university' | 'program' | 'vocational'
): Promise<void> {
    // Construct the key for the metadata file
    const metadataKey = `Text${fileKey}.metadata.json`;

     // Convert the data to JSON string, and  formatting it according to the type
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
        } : type === 'vocational' ? {
            "vocationalCenterName": data["Vocational Training center"],
            "vocationalLocation": data["Vocational Location"],
            "dateOfReview": data["Date of Review"]
        } : {
            "universityName": data["University Name"],
            "programmeName": data["Programme Name"],
            "programmeJudgment": data["Programme Judgment"]
        }
    }, null, 2);

    try {
         // Upload the metadata file to S3
        await s3.putObject({
            Bucket: bucketName,
            Key: metadataKey,
            Body: metadataContent,
            ContentType: "application/json",
        }).promise();
        console.log(`Metadata file ${metadataKey} created in bucket ${bucketName}`);
    } catch (error) {
        // console log any errors
        console.error("Error creating metadata file in S3:", error);
    }
}
// This function handles what happens after a DynamoDB insert by creating a corresponding metadata file in S3
export async function handleDynamoDbInsert(
    event: any, 
    bucket: string, 
    fileKey: string, 
    type: 'institute' | 'university' | 'program' | 'vocational' = 'institute'
): Promise<void> {
    if (!bucket) {
        throw new Error("Bucket name not defined");
    }

     // Remove the .pdf extension from the file key
    const sanitizedFileKey = fileKey.replace(".pdf", "");
     // Call the insertMetadataFile function with the processed parameters
    await insertMetadataFile(bucket, sanitizedFileKey, event, type);
}