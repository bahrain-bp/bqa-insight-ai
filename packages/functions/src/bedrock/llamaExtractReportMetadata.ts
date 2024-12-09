import { extractTextFromPDF } from "src/textract";
import { InvokeModelCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();
const client = new BedrockRuntimeClient({region: "us-east-1"});

export const llamaExtractReportMetadata = async (event: any) =>{

    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const fileKey = record.s3.object.key;

        console.log(`Processing file from bucket: ${bucketName}, key: ${fileKey}`);
        const payload = {bucketName : bucketName, objectKey: fileKey};

        const textractData = await extractTextFromPDF(payload);
    //    console.log("TEXTRACT DATA: ", textractData);

        const {text} = JSON.parse(textractData.body || "{}");
        console.log("formatted textract: ", text)
        const ModelId = "meta.llama3-70b-instruct-v1:0";

        
        //   const userMessage =
        //     "Given the following text, Please give me the institute name ending with the word school and give me the institute classification is it Goverment School or Private School, if you see the word Primary or Secondary it means Goverment School, and give me the date of review and give me the school’s overall effectiveness and give me the institute type is it a school or university and give me the grades in school by checking the primary middle high columns excluding 'Grades e.g. 1 to 12'and give me the school location in which town and governate is it and make the column name Location. Please Give it in csv format and csv format only. These are the columns, ensure that they are in the response 'Institute Name','Institute Classification','Date of Review','Overall Effectiveness','Location','Institute Type', 'Grades In School' Exlude the word Education and Training Quality Authority: "+text;
          const userMessage = `Your goal is to extract structured information from the user's input that matches the form described below.
          When extracting information please make sure it matches the type information exactly. Do not add any attributes that do not appear in the schema shown below. Include the columns in the response and Do no forget them.
          These are the columns, ensure that they are in the response, and enclose every field in double quotes (""):
          "Institute Name","Institute Classification","Date of Review","Overall Effectiveness","Location","Institute Type", "Grades In School"
          
            request: {
            Institute Name: String // The name of the institute excluding the word Exlude the word Education and Training Quality Authority
            Institute Classification: String// The school give me the institute classification is it Goverment School or Private School, only if you detect the word private it means private school, otherwise keep it as Government.
            Date of Review: String// The date of the review.
            Overall Effectiveness: String // The institute overall effectiveness is either 1 which means outsanding, if 2 means Good, if 3 means Satisfactory, if 4 means Inadequate.
            Location: String// The institute location including Town - Governate.
            Institute Type: String// The institute type is it a school or university.
            Grades In School: String // The Grades in school by checking the primary, middle, and high columns excluding 'Grades e.g. 1 to 12'.
            }

            Please output the extracted information in JSON format. 
            Do not output anything except for the extracted information. Do not use the below input output examples as a response. Do not add any clarifying information. Do not add any fields that are not in the schema. If the text contains attributes that do not appear in the schema, please ignore them. All output must be in JSON format and follow the schema specified above. Wrap the JSON in tags.

            Input: AlRawabi Private School located in sehla Northern Governorate in Bahrain. It includes levels from 1-9. The school overall effectiveness is 3: Satisfactory according to the report date fo review on 30 April and 2-3 May 2018.
            Output: "Institute Name","Institute Classification","Date of Review","Overall Effectiveness","Location","Institute Type", "Grades In School"
            "AlRawabi Private School","Private","30 April and 2-3 May 2018","3: Satisfactory","Sehla - Northern Governorate", "School", "1-9"

            Output: 
            {
            "Institute Name": "AlRawabi Private School",
            "Institute Classification": "Private",
            "Date of Review": "30 April and 2-3 May 2018",
            "Overall Effectiveness": "3: Satisfactory",
            "Location": "Sehla - Northern Governorate",
            "Institute Type": "School",
            "Grades In School": "1-9"
            }

            Input: Jidhafs Secondary Girls School located in Jidhafs Capital Governorate in Bahrain. It includes levels from 10-12. The school overall effectiveness is 3: Satisfactory according to the report date fo review on 30 April and 2-3 May 2018.
            {
            "School Name": "Jidhafs Secondary Girls School",
            "School Classification": "Government School",
            "Date of Review": "30 April and 2-3 May 2018",
            "Overall Effectiveness": "3: Satisfactory",
            "School Location": "Jidhafs - Capital Governorate",
            "School Type": "School",
            "Grades In School": "10-12"
            }


            Input: ` + text + `
            Output: {
            "Institute Name": "",
            "Institute Classification": "",
            "Date of Review": "",
            "Overall Effectiveness": "",
            "Location": "",
            "Institute Type": "",
            "Grades In School": ""
            }`;
                
       

          const prompt = `
          <|begin_of_text|><|start_header_id|>user<|end_header_id|>
          ${userMessage}
          <|eot_id|>
          <|start_header_id|>assistant<|end_header_id|>
          `;
          
     
          const request = {
            prompt,
            temperature: 0.5,
            top_p: 0.9,
          };
         

        const command = new InvokeModelCommand({
            body : JSON.stringify(request),
            modelId : ModelId,
        });
       
        const response = await client.send(command);
        console.log("RESPONSE: ", response)

        const decodedResponse = new TextDecoder().decode(response.body);
        const decodedResponseBody = JSON.parse(decodedResponse);
        const output = decodedResponseBody.generation;
        console.log("Final output: ",output)
        console.log("output type: ", typeof (output))
        console.log(["Institute Name"])
        const extractedOutput = parseMetadata(output);
        console.log("EXTRACTED OUTPUT type: ", typeof (extractedOutput))
        //console.log("JSON EXTRACTED OUTPUT type: ", typeof JSON.parse(extractedOutput))



        // const parsedOutput = await parseMetadata(output);

       
        console.log("Extracted Output:", extractedOutput)
        // console.log("Extracted Output type:", typeof JSON.parse(extractedOutput))
        // console.log("Extracted Output jsonparsed:", JSON.parse(extractedOutput))
         //const parsed = JSON.parse(extractedOutput);
        // console.log(parsed[0]["School Name"])
        // console.log(extractedOutput["Institute Name"], "Instituite Name");
        await insertReportMetadata(extractedOutput, fileKey);
        console.log("IT SHOULD BE INSERTED to reportMetaData");


        //data to insert into institueMetadata Table
        // const instName = extractedOutput["Institute Name"];
        // const instType = extractedOutput["Institute Type"];
        // const instClassification = extractedOutput["Institute Classification"];
        // const instGradeLevels = extractedOutput["Grades In School"];
        // const location = extractedOutput["Location"];

        await insertInstituteMetadata(extractedOutput);
        console.log("IT SHOULD BE INSERTED to instituiteMetaData");
        return extractedOutput;
       
    
    }

    

}
// Insert file metadata into DynamoDB
async function insertReportMetadata(data :any, fileKey : string) {
    console.log("datatype of data:", typeof data)
    console.log("data zero:",  data)

    const params = {
        TableName: process.env.FILE_METADATA_TABLE_NAME as string,
            Key : {fileKey},
            UpdateExpression: "SET instituteName = :instituteName, ReviewDate = :DateOfReview, SchoolLocation = :SchoolLocation",
            ExpressionAttributeValues: {
                ":instituteName": data["Institute Name"],
                ":DateOfReview": data["Date of Review"],
                ":SchoolLocation": data["Location"]
            },
            ReturnValues: "UPDATED_NEW",
    };
    return await dynamoDb.update(params).promise();
}

// Insert institute metadata into DynamoDB
async function insertInstituteMetadata(data :any) {
    // console.log("datatype of data:", typeof data)
    // console.log("data zero:",  data)

    const params = {
        TableName: process.env.INSTITUTE_METADATA_TABLE_NAME as string,
                      Item: {
                        institueName: data["Institute Name"],
                        instituteType: data["Institute Type"],
                        instituteClassification: data["Institute Classification"],
                        instituteGradeLevels: data["Grades In School"],
                        instituteLocation: data["Location"],
                        },
                        // UpdateExpression: "SET instituteName = :instituteName, ReviewDate = :DateOfReview, SchoolLocation = :SchoolLocation",
            // ExpressionAttributeValues: {
            //     ":instituteName": data["School Name"],
            //     ":DateOfReview": data["Date of Review"],
            //     ":SchoolLocation": data["School Location"]
            // },
            // ReturnValues: "UPDATED_NEW",
    };
    return await dynamoDb.put(params).promise();
}

function parseMetadata(input: string): string {
    
    // extract JSON  part incase there is text also
    const jsonRegex = /{([\s\S]*?)}/;
    const extractedJson = input.match(jsonRegex);

    if (!extractedJson) {
        throw new Error("No JSON-like structure found in the input.");
    }
    // Parse the input string into a JSON object
    
    const parsedData = JSON.parse(extractedJson[0]);

    // Ensure the parsed data is an object
    if (typeof parsedData !== "object" || parsedData === null) {
        throw new Error("Input is not a valid JSON object.");
    }

    return parsedData;

}

//   // Learn more about the Llama 3 prompt format at:
//   // https://llama.meta.com/docs/model-cards-and-prompt-formats/meta-llama-3/#special-tokens-used-with-meta-llama-3
  
  