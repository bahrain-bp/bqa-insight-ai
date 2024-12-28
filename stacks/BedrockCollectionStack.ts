import { Duration, aws_opensearchserverless as opensearchserverless } from 'aws-cdk-lib';
import { StackContext } from 'sst/constructs';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { custom_resources as cr } from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';

export function BedrockCollectionStack({ stack, app }: StackContext) {
 
    const collectionName = stack.stage + '-opensearch-collection'

    const cfnAccessPolicy = new opensearchserverless.CfnAccessPolicy(stack, 'BedrockCfnAccessPolicy', {
        name: stack.stage + '-access-policy',
        policy: `[{"Rules":[{"ResourceType":"collection","Resource":["collection/${collectionName}"],"Permission":["aoss:*"]}],"Principal":["arn:aws:sts::588738578192:assumed-role/AWSReservedSSO_AWSAdministratorAccess_ea3c4eb759f2e700/202101277@Student.polytechnic.bh"]}]`,
        type: 'data',
    });

    // const cfnAccessPolicy = new opensearchserverless.CfnAccessPolicy(stack, 'BedrockCfnAccessPolicy', {
    //     name: `${stack.stage}-access-policy`,
    //     policy: JSON.stringify({
    //         Version: "2012-10-17",
    //         Statement: [
    //             {
    //                 Sid: "AllowAccessToCollection",
    //                 Effect: "Allow",
    //                 Principal: {
    //                     AWS: `arn:aws:iam::${stack.account}:user/test-user`
    //                 },
    //                 Action: [
    //                     "aoss:Search",
    //                     "aoss:Write",
    //                     "aoss:ReadDocument",
    //                     "aoss:UpdateDocument"
    //                 ],
    //                 Resource: `arn:aws:aoss:${stack.region}:${stack.account}:collection/${collectionName}`
    //             }
    //         ]
    //     }),
    //     type: 'data'
    // });
    
    

    const cfnEncryptionPolicy = new opensearchserverless.CfnSecurityPolicy(stack, 'BedrockCfnEncryptionPolicy', {
        name: stack.stage + '-encryption-policy',
        // policy: `{"Rules":[{"ResourceType":"collection","Resource":["collection/${collectionName}"]}],"AWSOwnedKey":true}`,
        policy: JSON.stringify({
          Rules: [
              {
                  ResourceType: "collection",
                  Resource: [`collection/${collectionName}`],
              },
          ],
          AWSOwnedKey: true,
        }),
        type: 'encryption',
      });
  
      const cfnCollection = new opensearchserverless.CfnCollection(stack, 'BedrockCfnCollection', {
          name: collectionName,
          // the properties below are optional
          type: 'VECTORSEARCH',
      });

      const cfnNetworkPolicy = new opensearchserverless.CfnSecurityPolicy(stack, 'BedrockCfnNetworkPolicy', {
        name: stack.stage + '-network-policy',
        policy: `[{"Rules":[{"ResourceType":"collection","Resource":["collection/${collectionName}"]}],"AllowFromPublic":true}]`,
        type: 'network',
    });

    const indexCreatorLambda = new lambda.Function(stack, 'IndexCreatorLambda', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'createIndex.handler',
        code: lambda.Code.fromAsset('packages/functions/src/bedrock/'),
        environment: {
            COLLECTION_NAME: cfnCollection.attrCollectionEndpoint,
        },
        timeout: Duration.seconds(30),
    });

    // Add permissions for Lambda
    indexCreatorLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: [
            'aoss:APIAccessAll',
            'aoss:DescribeIndex',
            'aoss:CreateIndex',
        ],
        resources: [cfnCollection.attrArn],
    }));

    new cr.Provider(stack, 'IndexCreatorProvider', {
        onEventHandler: indexCreatorLambda,
        logRetention: logs.RetentionDays.ONE_DAY,
    });

  
      cfnCollection.addDependency(cfnEncryptionPolicy)
      cfnCollection.addDependency(cfnAccessPolicy)
      cfnCollection.addDependency(cfnNetworkPolicy)
  

    

    return {
        cfnCollection
    }
}
