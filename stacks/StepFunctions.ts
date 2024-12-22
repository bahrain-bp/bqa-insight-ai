import { StackContext, Function } from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export function stepFunctionsStack({ stack }: StackContext) {

    const claudeUniversityMetadata = new lambda.Function(stack, "claudeUniversityMetadataFunction", {
        handler: "packages/functions/src/bedrock/ClaudeUniversityMetadata.handler"
    })

    const claudeExtractReportMetadata = new Function(stack, "claudeExtractReportMetadata", {
        handler: "packages/functions/src/bedrock/claudeExtractReportMetadata.handler"
    })

    
    

    return {claudeUniversityMetadata, claudeExtractReportMetadata}
}