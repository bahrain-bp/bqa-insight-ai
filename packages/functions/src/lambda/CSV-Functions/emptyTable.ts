// src/CSV-Functions/emptyTable.ts

import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * Deletes all items from the specified DynamoDB table.
 *
 * @param tableName - The name of the DynamoDB table to empty.
 */
export async function emptyTable(tableName: string): Promise<void> {
    console.log(`Starting to empty table: ${tableName}`);

    let lastEvaluatedKey: AWS.DynamoDB.DocumentClient.Key | undefined = undefined;

    do {
        const scanParams: AWS.DynamoDB.DocumentClient.ScanInput = {
            TableName: tableName,
            ProjectionExpression: "InstitutionCode", // Replace 'PrimaryKey' with your table's primary key attribute name
            ExclusiveStartKey: lastEvaluatedKey,
        };

        try {
            const scanResult = await dynamoDb.scan(scanParams).promise();

            if (scanResult.Items && scanResult.Items.length > 0) {
                // Prepare delete requests
                const deleteRequests = scanResult.Items.map(item => ({
                    DeleteRequest: { Key: item }
                }));

                // Batch delete items in groups of 25
                const batches: AWS.DynamoDB.DocumentClient.WriteRequest[][] = [];
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
        } catch (error) {
            console.error(`Error emptying table ${tableName}:`, error);
            throw error; // Re-throw the error after logging
        }
    } while (lastEvaluatedKey);

    console.log(`Successfully emptied table: ${tableName}`);
}
