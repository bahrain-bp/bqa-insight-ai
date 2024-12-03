import { Function, StackContext } from "sst/constructs";
import * as lex from "aws-cdk-lib/aws-lex";
import * as iam from "aws-cdk-lib/aws-iam";

export function BotStack({ stack }: StackContext) {
    // Create an IAM Role for the Lex bot
    const fulfillmentFunction = new Function(stack, "FulfillmentFunction", {
        handler: "packages/functions/src/LexBot/intentAmazonLexFulfillment.lambda_handler",
        runtime: "python3.11", // SST automatically maps this
        memorySize: 512,
        timeout: 60,
        environment: {
        },
        permissions: ["lex"], // SST automatically configures IAM permissions

    });
    const lexRole = new iam.Role(stack, "LexBotRole", {
        assumedBy: new iam.ServicePrincipal("lex.amazonaws.com"),
        inlinePolicies: {
            LexBotCustomPolicy: new iam.PolicyDocument({
                statements: [
                    // Allow invoking the fulfillment function
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "lambda:InvokeFunction",
                            "lambda:InvokeAsync",
                            "lambda:GetFunctionConfiguration",
                        ],
                        resources: [
                            fulfillmentFunction.functionArn, // Allow invoking the fulfillment function
                        ],
                    }),
                    // Allow Lex service permissions
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "lex:StartConversation",
                            "lex:RecognizeUtterance",
                            "lex:ListBots",
                            "lex:DescribeBot",
                            "lex:CreateBotAlias",
                            "lex:UpdateBotAlias",
                        ],
                        resources: ["*"], // You can replace this with specific ARNs for tighter security
                    }),
                    // Allow logging permissions
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                        ],
                        resources: ["arn:aws:logs:*:*:*"],
                    }),
                ],
            }),
        },
    });


    // @ts-ignore
    const bot = new lex.CfnBot(stack, "LexBot", {
        name: `${stack.stackName}-Lex`,
        roleArn: lexRole.roleArn,
        dataPrivacy: {
            "ChildDirected" : false
        },
        idleSessionTtlInSeconds: 300,
        description: "A bot for comparing educational institutes for BQA 2",
        botLocales: [
            {
                localeId: "en_US",
                nluConfidenceThreshold: 0.4,
                voiceSettings: {
                    voiceId: "Ivy",
                },
                intents: [
                    {
                        name: "BQAIntent",
                        description:
                            "Intent to provide the user with a detailed comparison of educational institutes.",
                        sampleUtterances: [
                            { utterance: "Hello BQA" },
                            { utterance: "compare" },
                        ],
                        fulfillmentCodeHook: {
                            enabled: true,
                        },
                        intentConfirmationSetting: {
                            promptSpecification: {
                                messageGroupsList: [
                                    {
                                        message: {
                                            plainTextMessage: {
                                                value:
                                                    "Do you want to compare between Bahrain Polytechnic and UOB?",
                                            },
                                        },
                                    },
                                ],
                                maxRetries: 2,
                            },
                            declinationResponse: {
                                messageGroupsList: [
                                    {
                                        message: {
                                            plainTextMessage: {
                                                value: "Can you explain more?",
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                        slots: [
                            {
                                name: "BQASlot",
                                slotTypeName: "BQASlotType",
                                valueElicitationSetting: {
                                    slotConstraint: "Required",
                                    promptSpecification: {
                                        messageGroupsList: [
                                            {
                                                message: {
                                                    plainTextMessage: {
                                                        value: "How can I help you?",
                                                    },
                                                },
                                            },
                                        ],
                                        maxRetries: 2,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    });



    // Define a Lambda function for Lex fulfillment
    const communicationFunction = new Function(stack, "CommunicationFunction", {
        handler: "packages/functions/src/LexBot/communicateAmazonLexLambda.lambda_handler",
        runtime: "python3.11",
        memorySize: 512,
        timeout: 60,
        permissions: ["lex"], // Automatically configures IAM permissions
    });

    // Add an alias for the Lex bot (use the bot version directly)
    const alias = new lex.CfnBotAlias(stack, "LexBotAlias", {
        botAliasName: "liveAlias",
        botId: bot.ref,
        botVersion: "DRAFT", // Automatically reference the latest version
        botAliasLocaleSettings: [
            {
                botAliasLocaleSetting: {
                    enabled: true,

                    // the properties below are optional
                    codeHookSpecification: {
                        lambdaCodeHook: {
                            codeHookInterfaceVersion: "1.0", // Mandatory field
                            lambdaArn: fulfillmentFunction.functionArn, // Provide the Lambda function ARN
                        },
                    },
                },
                localeId: 'localeId',
            },
        ],
    });

    // Add environment variables to the Lambda function, but avoid circular dependencies
    communicationFunction.addEnvironment("BOT_ALIAS_ID", alias.ref);

    // Return bot and alias IDs
    return {
        botId: bot.ref,
        aliasId: alias.ref,
    };
}






