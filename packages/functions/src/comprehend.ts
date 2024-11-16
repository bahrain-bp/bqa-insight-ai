import { APIGatewayEvent } from 'aws-lambda';
import { Bucket } from "sst/node/bucket";
import { ComprehendClient, DetectKeyPhrasesCommand, DetectEntitiesCommand, EntityType } from '@aws-sdk/client-comprehend';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({})
const client = new ComprehendClient({ region: "us-east-1" });

// type for the input
interface ComprehendRequest {
  text: string
  objectKey?: string
}

// type for the output
interface TextAnalysisResponse {
  keyPhrases: string;
  entities: FilteredEntities
}

// type for the entities output
interface FilteredEntities {
  locations: string[];
  organizations: string[];
  dates: string[];
}

export async function sendTextToComprehend(event: APIGatewayEvent) {
  try {
    const { text, objectKey }: ComprehendRequest = JSON.parse(event.body || "{}");

    if (!text) {
      throw new Error('Text not provided');
    }
;
    const keyPhrasesCommand = new DetectKeyPhrasesCommand({
      Text: text,
      LanguageCode: "en"
    });

    // Detect entities
    const entitiesCommand = new DetectEntitiesCommand({
      Text: text,
      LanguageCode: 'en'
    });

    // Execute both commands in parallel
    const [keyPhrasesResponse, entitiesResponse] = await Promise.all([
      client.send(keyPhrasesCommand),
      client.send(entitiesCommand)
    ]);

    // map key phrases from array to one paragrpah
    const keyPhrasesArray = keyPhrasesResponse.KeyPhrases?.map(phrase => phrase.Text || '') || [];
    const keyPhrasesParagraph = keyPhrasesArray.join(', ') + '.';

    // Filter entities by type
    const filteredEntities: FilteredEntities = {
      locations: entitiesResponse.Entities?.filter(entity => 
        entity.Type === EntityType.LOCATION).map(entity => entity.Text || '') || [],
      organizations: entitiesResponse.Entities?.filter(entity => 
        entity.Type === EntityType.ORGANIZATION).map(entity => entity.Text || '') || [],
      dates: entitiesResponse.Entities?.filter(entity => 
        entity.Type === EntityType.DATE).map(entity => entity.Text || '') || []
    };

    const response: TextAnalysisResponse = {
      keyPhrases: keyPhrasesParagraph,
      entities: filteredEntities
    };

    // upload response to S3 if object key is provided
    if (objectKey) {
      const split = objectKey.split('/')
      const uuid = split[split.length - 1]
      insertToS3(JSON.stringify(response), uuid)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Text summarized successfully', response }),
    };
  } catch (error) {
    console.error('Error processing text:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to summarize text' }),
    };
  }
}

async function insertToS3(fileContents: string, uuid: string) {
  const bucket = Bucket.ComprehendBucket
  const fileName = `comprehend-${uuid}.json`

  try {
    const command = new PutObjectCommand({
      Body: fileContents,
      Bucket: bucket.bucketName,
      Key: fileName,
    })
    const response = await s3Client.send(command)
    console.log("File uploaded", response)
  } catch (error) {
    console.error("Could not upload file", error)
  }
}
