import { Function, Bucket, Queue, StackContext, use } from "sst/constructs";
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Duration, aws_iam as iam } from "aws-cdk-lib";
import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import {
    LexCustomResource,
    LexBotDefinition,
} from '@amaabca/aws-lex-custom-resources';
import { AmazonLexSolarMapFulfillment } from './AmazonLexSolarMapFulfillment';

export function BQABot({ stack }: StackContext) {

    const amazonLexSolarMapFulfillment = use(AmazonLexSolarMapFulfillment);
    const fulfillmentFunction = amazonLexSolarMapFulfillment.fulfillmentFunction;
    
    // Setting up the custom resource from the AWS Serverless Application Repo.
    // Application link: https://serverlessrepo.aws.amazon.com/applications/us-east-1/777566285978/lex-v2-cfn-cr
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
        'SolarMapBot',
        provider.serviceToken(),
        {
            botName: stack.stackName + '-Lex',
            dataPrivacy: {
                childDirected: false,
            },
            description: 'A guide to solar energy in Bahrain',
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
        slotTypeName: 'SolarMapSlot',
        description: 'Everything Solar Map',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'About' } },
            { sampleValue: { value: 'Providers' } },
            { sampleValue: { value: 'Calculation' } },
            { sampleValue: { value: 'Process' } },
            { sampleValue: { value: 'More' } },
            { sampleValue: { value: 'Data & Privacy' } },
        ],
    });

    const BQAIntent = locale.addIntent({
        intentName: 'BQAIntent',
        description: 'Intent to provide user with detailed comparision of educational institutes.',
        sampleUtterances: [
            { utterance: 'Hello BQA' },
            { utterance: 'Hi SolarMap' },
            { utterance: 'About' },
            { utterance: 'Tell me more' },
            { utterance: 'What is this?' },
            { utterance: 'Who are you?' },
            { utterance: 'How can I get started?' },
            { utterance: 'Good morning' },
            { utterance: 'Good afternoon' },
            { utterance: 'Explain'},
            { utterance: 'Another'},
            { utterance: 'Next'},
            { utterance: 'Again'},
            { utterance: 'Help'},
            { utterance: 'Providers'},
            { utterance: 'Calculation'},
            { utterance: 'Data & Privacy'},
            { utterance: 'Process'},
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
                                value: 'Okay, your selected category is "{SolarMapSlot}", please type "Confirm".',
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
                                value: 'Okay, please choose another category.'
                            },
                        },
                    },
                ],
            },
        },
    });

    BQAIntent.addSlot({
        slotName: 'SolarMapSlot',
        slotTypeName: 'SolarMapSlot',
        description: 'The type of category to learn about',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    { 
                        message: { 
                           imageResponseCard: { 
                              buttons: [ 
                                 { 
                                    text: "About",
                                    value: "About"
                                 },
                                 { 
                                    text: "Providers",
                                    value: "Providers"
                                 },
                                 { 
                                    text: "Calculation",
                                    value: "Calculation"
                                 },
                                 { 
                                    text: "Process",
                                    value: "Process"
                                 },
                                 { 
                                    text: "Data & Privacy",
                                    value: "Data & Privacy"
                                 },
                              ],
                              imageUrl: "https://ee-files.s3.amazonaws.com/files/110894/images/solar-panel-array-6_6092713d15247ca41d4ec08f9529c889-min_1440.jpg",
                              subtitle: "Please pick a category to get started or say More for additional support",
                              title: "Learn About Everything Solar Map"
                           },
                        },
            }],
                maxRetries: 2,
            },
        },
    });



    // Calculation Intent

    locale.addSlotType({
        slotTypeName: 'ElectricityConsumptionSlot',
        description: 'Types of electricity consumption levels',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'Low' } },
            { sampleValue: { value: 'Medium' } },
            { sampleValue: { value: 'High' } },
            { sampleValue: { value: '300 kilowatt' } },
        ],
    });

    locale.addSlotType({
        slotTypeName: 'RoofTypeSlot',
        description: 'Types of rooftops materials',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'Flat' } },
            { sampleValue: { value: 'Sloped' } },
            { sampleValue: { value: 'Metal' } },
            { sampleValue: { value: 'Tile' } },
            { sampleValue: { value: 'Asphalt' } },
            { sampleValue: { value: 'Something else' } },
        ],
    });

    locale.addSlotType({
        slotTypeName: 'InstallationTimelineSlot',
        description: 'Types of installation time periods',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'ASAP' } },
            { sampleValue: { value: '3 months' } },
            { sampleValue: { value: '6 months' } },
            { sampleValue: { value: 'Flexible' } },
        ],
    });

    locale.addSlotType({
        slotTypeName: 'ShadingSlot',
        description: 'Types of shading levels',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'Low' } },
            { sampleValue: { value: 'Medium' } },
            { sampleValue: { value: 'High' } },
        ],
    });

    locale.addSlotType({
        slotTypeName: 'PropertySizeSlot',
        description: 'Types of property size categories',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'Small' } },
            { sampleValue: { value: 'Medium' } },
            { sampleValue: { value: 'Large' } },
            { sampleValue: { value: '200 square meters' } },
        ],
    });

    locale.addSlotType({
        slotTypeName: 'BudgetSlot',
        description: 'Types of budget categories',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'Low' } },
            { sampleValue: { value: 'Medium' } },
            { sampleValue: { value: 'High' } },
        ],
    });

    locale.addSlotType({
        slotTypeName: 'LocationSlot',
        description: 'Types of location areas',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'City center' } },
            { sampleValue: { value: 'Suburb' } },
            { sampleValue: { value: 'Rural area' } },
        ],
    });

    locale.addSlotType({
        slotTypeName: 'RoofOrientationSlot',
        description: 'Types of rooftop orientation angles',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            { sampleValue: { value: 'South' } },
            { sampleValue: { value: 'East' } },
            { sampleValue: { value: 'Multiple directions' } },
        ],
    });


    // create/update the bot resource
    const bot = botDefinition.build();

    // create a version that automatically is built when the bot changes
    const version = bot.automaticVersion();

    // create an alias and assign it to the latest bot version
    bot.addAlias({
        botAliasName: 'liveAlias',
        botVersion: version.botVersion(),
        botAliasLocaleSettings: {
            en_US: {
                codeHookSpecification: { 
                    lambdaCodeHook: { 
                       codeHookInterfaceVersion: "1.0",
                       lambdaARN: fulfillmentFunction.functionArn,
                    }
                 },
                 enabled: true,
            },
        },
    });
    
}