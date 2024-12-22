import { aws_bedrock as bedrock, aws_iam as iam } from 'aws-cdk-lib';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { StackContext } from 'sst/constructs';

export function BedrockExpressStack ({stack, app} : StackContext){

    //create the iam role
    const amazonBedrockExpressExecutionRoleForAgents = new iam.Role(stack, "amazonBedrockExpressExecutionRoleForAgents", {
        assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
      });
      amazonBedrockExpressExecutionRoleForAgents.addToPolicy(new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel"
        ],
        resources: ["arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1"]
      }));

      //creating bedrock agent to extract report's metadata
      const extractReportMetadataAgent = new bedrock.CfnAgent(stack, 'bedrockAgent', {
        agentName : "extractMetadataAgent-"+app.stage,

        //agent role arn
        agentResourceRoleArn: amazonBedrockExpressExecutionRoleForAgents.roleArn,
        foundationModel: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1',
        idleSessionTtlInSeconds: 600,
        instruction: 'Extract metadata aboout reports and information about educational institutes in Bahrain. The output should be a table.',
        knowledgeBases: [],

    })

    //create agent alias
    const becrockExtractAgentAlias = new bedrock.CfnAgentAlias(stack, 'berockAgentAlias', {
        agentAliasName: 'extractMetadataAgentAlias-'+app.stage,
        agentId: extractReportMetadataAgent.attrAgentId,}
        )

        stack.addOutputs({
          Agent: extractReportMetadataAgent.agentName
        })

        return{
             extractReportMetadataAgent,
             becrockExtractAgentAlias,
        }
}

