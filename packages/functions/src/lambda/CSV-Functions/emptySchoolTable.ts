import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export async function emptySchoolTable(tableName: string, schoolType: string) {
    let lastEvaluatedKey: AWS.DynamoDB.DocumentClient.Key | undefined = undefined;
  
    do {
      const scanParams: AWS.DynamoDB.DocumentClient.ScanInput = {
        TableName: tableName,
        ProjectionExpression: "InstitutionCode", // Only retrieve the key
        FilterExpression: "SchoolType = :schoolType",
        ExpressionAttributeValues: {
          ":schoolType": schoolType
        },
        ExclusiveStartKey: lastEvaluatedKey
      };
  
      const scanResult = await dynamoDb.scan(scanParams).promise();
  
      if (scanResult.Items && scanResult.Items.length > 0) {
        const deleteRequests = scanResult.Items.map(item => ({
          DeleteRequest: { Key: { InstitutionCode: item.InstitutionCode } }
        }));
  
        // Batch delete can handle up to 25 items per request
        const batches = [];
        while (deleteRequests.length) {
          batches.push(deleteRequests.splice(0, 25));
        }
  
        for (const batch of batches) {
          const batchParams: AWS.DynamoDB.DocumentClient.BatchWriteItemInput = {
            RequestItems: {
              [tableName]: batch
            }
          };
          console.log(`Deleting ${batch.length} items from ${tableName}`);
          await dynamoDb.batchWrite(batchParams).promise();
        }
      }
  
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);
}