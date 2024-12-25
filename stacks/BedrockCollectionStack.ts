import { aws_opensearchserverless as opensearchserverless } from 'aws-cdk-lib';
import { StackContext } from 'sst/constructs';

export function BedrockCollectionStack({ stack, app }: StackContext) {
 
    const collectionName = stack.stage + '-opensearch-collection'

    const cfnAccessPolicy = new opensearchserverless.CfnAccessPolicy(stack, 'BedrockCfnAccessPolicy', {
        name: stack.stage + '-access-policy',
        policy: `[{"Rules":[{"ResourceType":"collection","Resource":["collection/${collectionName}"],"Permission":["aoss:*"]}],"Principal":["arn:aws:iam::${stack.account}:user/test-user"]}]`,
        type: 'data',
    });
    const cfnNetworkPolicy = new opensearchserverless.CfnSecurityPolicy(stack, 'BedrockCfnNetworkPolicy', {
        name: stack.stage + '-network-policy',
        policy: `[{"Rules":[{"ResourceType":"collection","Resource":["collection/${collectionName}"]}],"AllowFromPublic":true}]`,
        type: 'network',
    });
    const cfnEncryptionPolicy = new opensearchserverless.CfnSecurityPolicy(stack, 'BedrockCfnEncryptionPolicy', {
        name: stack.stage + '-encryption-policy',
        policy: `{"Rules":[{"ResourceType":"collection","Resource":["collection/${collectionName}"]}],"AWSOwnedKey":true}`,
        type: 'encryption',
    });
    const cfnCollection = new opensearchserverless.CfnCollection(stack, 'BedrockCfnCollection', {
        name: collectionName,
        // the properties below are optional
        type: 'VECTORSEARCH',
    });
    cfnCollection.addDependency(cfnEncryptionPolicy)

    return {
        cfnCollection
    }
}
