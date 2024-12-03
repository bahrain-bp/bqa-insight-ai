import {Function, Bucket, Queue, StackContext, use} from "sst/constructs";
import * as cdk from "aws-cdk-lib";

import {
    LexCustomResource,
    LexBotDefinition,
} from '@amaabca/aws-lex-custom-resources';

export function BotStack({stack}: StackContext) {

    const provider = new LexCustomResource(
        stack,
        'LexV2CfnCustomResource',
        {
            semanticVersion: '0.3.0',
            logLevel: 'INFO',
        }
    );

    // The LexBotDefinition class is the main entry point to Lex bot creation.
    const botDefinition = new LexBotDefinition(
        stack,
        'BQABot',
        provider.serviceToken(),
        {
            botName: stack.stackName + '-Lex',
            dataPrivacy: {
                childDirected: false,
            },
            description: 'A Bot for comparing educational institutes for BQA 2',
            idleSessionTTLInSeconds: 300,
            roleArn: provider.serviceLinkedRoleArn(),
        }
    );

    // Add a language for our bot to which we can add intents/slots and slot types.

    const locale = botDefinition.addLocale({
        localeId: 'en_US',
        nluIntentConfidenceThreshold: 0.40,
        voiceSettings: {
            voiceId: 'Ivy',
        },
    });


    // Welcome Intent

    locale.addSlotType({
        slotTypeName: 'BQASlot',
        description: 'This is compare Slot type',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            {sampleValue: {value: 'compare between Bahrain Polytechnic and UOB '}},
            {sampleValue: {value: 'analyze'}},
        ],
    });

    const BQAIntent = locale.addIntent({
        intentName: 'BQAIntent',
        description: 'Intent to provide user with detailed comparision of educational institutes.',
        sampleUtterances: [
            {utterance: 'Hello BQA'},
            {utterance: 'compare'},
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
        intentConfirmationSetting: {
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'Do you want to compare between Bahrain Polytechnic and UOB?',
                            },
                        },
                    },
                ],
                maxRetries: 2,
            },
            declinationResponse: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'Can you explain more?',
                            },
                        },
                    },
                ],
            },
        },

    });

    BQAIntent.addSlot({
        slotName: 'BQASlot',
        slotTypeName: 'BQASlot',
        description: 'The type of category to learn about',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'How can I help you?'
                            },
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    });


    // Calculation Intent

/*    locale.addSlotType({
        slotTypeName: 'ElectricityConsumptionSlot',
        description: 'Types of electricity consumption levels',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            {sampleValue: {value: 'Low'}},
            {sampleValue: {value: 'Medium'}},
            {sampleValue: {value: 'High'}},
            {sampleValue: {value: '300 kilowatt'}},
        ],
    });*/


    // create/update the bot resource
    const bot = botDefinition.build();

    // create a version that automatically is built when the bot changes
    const version = bot.automaticVersion();
/*
    const fulfillmentFunction = new Function(stack, "FulfillmentFunction", {
        handler: "packages/functions/src/LexBot/intentAmazonLexFulfillment.lambda_handler",
        runtime: "python3.11", // SST automatically maps this
        memorySize: 512,
        timeout: 60,
        environment: {
        },
        permissions: ["lex"], // SST automatically configures IAM permissions

    });
*/

    const communicationFunction = new Function(stack, "CommunicationFunction", {
        handler: "packages/functions/src/LexBot/communicateAmazonLexLambda.lambda_handler",
        runtime: "python3.11",
        memorySize: 512,
        timeout: 60,
        environment: {
            BOT_ID: bot.resource.ref,
        },
        permissions: ["lex"], // SST automatically configures IAM permissions
    });
    // create an alias and assign it to the latest bot version
    const alias = bot.addAlias({
        botAliasName: 'liveAlias',
        botVersion: version.botVersion(),
        botAliasLocaleSettings: {
            en_US: {
                codeHookSpecification: {
                    lambdaCodeHook: {
                        codeHookInterfaceVersion: "1.0",
                        //lambdaARN: fulfillmentFunction.functionArn,
                    }
                },
                enabled: true,
            },
        },
    });
    communicationFunction.addEnvironment("BOT_ALIAS_ID", alias.resource.ref);
    return {
        bot,
        alias
    }

}
