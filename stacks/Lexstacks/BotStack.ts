import { StackContext } from "sst/constructs";
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Duration, aws_iam as iam } from "aws-cdk-lib";

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


    // Slot to select type of analysis

    locale.addSlotType({
        slotTypeName: 'BQASlotType',
        description: 'This is compare Slot type',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            {sampleValue: {value: 'Analyze'}},
            {sampleValue: {value: 'Compare'}},
            {sampleValue: {value: 'Other'}},
        ],
    });

    locale.addSlotType({
        slotTypeName: 'InstituteSlotType',
        description: 'Slot for institute name',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            {sampleValue: {value: 'School'}},
            {sampleValue: {value: 'Institute'}},
        ],
    })

    locale.addSlotType({
        slotTypeName: 'MetricSlotType',
        description: 'Slot for choosing a metric for the analysis',
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue'
        },
        slotTypeValues: [
            {sampleValue: {value: 'Overall Performance'}},
            {sampleValue: {value: 'Other'}},
        ],
    })

    const BQAIntent = locale.addIntent({
        intentName: 'BQAIntent',
        description: 'Intent to provide user with detailed comparision of educational institutes.',
        sampleUtterances: [
            {utterance: 'Hello BQA'},
            {utterance: 'compare'},
            { utterance: 'Hi BQA' },
            { utterance: 'About' },
            { utterance: 'Tell me more' },
            { utterance: 'What is this?' },
            { utterance: 'How can I get started?' },
            { utterance: 'Good morning' },
            { utterance: 'Explain' },
            { utterance: 'Another' },
            { utterance: 'Next' },
            { utterance: 'Again' },
            { utterance: 'Help' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
        // intentConfirmationSetting: {
        //     promptSpecification: {
        //         messageGroups: [
        //             {
        //                 message: {
        //                     plainTextMessage: {
        //                         value: 'Okay, your selected category is "{BQASlot}", please type "Confirm".',
        //                     },
        //                 },
        //             },
        //         ],
        //         maxRetries: 2,
        //     },
        //     declinationResponse: {
        //         messageGroups: [
        //             {
        //                 message: {
        //                     plainTextMessage: {
        //                         value: 'Okay, please choose another category.',
        //                     },
        //                 },
        //             },
        //         ],
        //     },
        // },

    });

    BQAIntent.addSlot({
        slotName: 'BQASlot',
        slotTypeName: 'BQASlotType',
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
                                      text: "Analyze",
                                      value: "Analyze"
                                   },
                                   { 
                                      text: "Compare",
                                      value: "Compare"
                                   },
                                   { 
                                      text: "Other",
                                      value: "Other"
                                   },
                                ],
                                subtitle: "What would you like me to do for you?",
                                title: "Learn About Educational Institutes"
                             },
                          },
                      },
                  ],
                maxRetries: 2,
            },
        },
    });

    // New intents for each button option
    const analyzingIntent = locale.addIntent({
        intentName: 'AnalyzingIntent',
        description: 'Provide information about analyzing educational institutes',
        sampleUtterances: [
            { utterance: 'Tell me more about analyzing' },
            { utterance: 'Analyze' },
            { utterance: 'Analyzing' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    });

    analyzingIntent.addSlot({
        slotName: 'InstituteSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Name of the institute to analyze',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What school or university would you like to analyze?'
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    analyzingIntent.addSlot({
        slotName: 'MetricSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Metric to analyze',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What aspect would you like to analyze?'
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    const comparingIntent = locale.addIntent({
        intentName: 'ComparingIntent',
        description: 'Provide information about comparing educational institutes',
        sampleUtterances: [
            { utterance: 'Tell me more about comparing' },
            { utterance: 'Compare' },
            { utterance: 'Comparing' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    });

    comparingIntent.addSlot({
        slotName: 'CompareInstituteSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Compare 2 or more institutes',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "Do you want to compare based on governorate or specific institute's?",
                                buttons: [
                                    {
                                        text: "Governorate",
                                        value: "Governorate"
                                    },
                                    {
                                        text: "Specific Institutes",
                                        value: "Specific Institutes"
                                    }
                                ]
                            }
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    const compareInstitutesIntent = {
        name: 'CompareInstitutesIntent',
        slots: [
          {
            name: 'CompareInstitutesSlot',
            type: 'AMAZON.FreeFormInput',
            elicitationRequired: true,
            prompts: {
              elicitation: {
                messageGroups: [
                  {
                    message: {
                      plainTextMessage: {
                        value: "What are the names of institutes you would like to compare?"
                      }
                    }
                  }
                ],
                maxRetries: 2
              }
            }
          }
        ]
      };
      

    const comparedGovernorateIntent = locale.addIntent({
        intentName: 'CompareGovernorateIntent',
        description: 'Provide comparison of educational institutes based on governorate',
        sampleUtterances: [
            { utterance: 'Compare by governorate' },
            { utterance: 'Governorate comparison' },
            { utterance: 'Compare governorates' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    })

    const otherIntent = locale.addIntent({
        intentName: 'OtherIntent',
        description: 'Handle other inquiries about educational institutes',
        sampleUtterances: [
            { utterance: 'I have another question' },
            { utterance: 'Other' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    });

    comparedGovernorateIntent.addSlot({
        slotName: 'GovernorateSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Select the governorate to compare institutes',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "Which governorate institutes would you like to compare?",
                                buttons: [
                                    {
                                        text: "Capital Governorate",
                                        value: "Capital Governorate"
                                    },
                                    {
                                        text: "Muharraq Governorate",
                                        value: "Muharraq Governorate"
                                    },
                                    {
                                        text: "Northern Governorate",
                                        value: "Northern Governorate"
                                    },
                                    {
                                        text: "Southern Governorate",
                                        value: "Southern Governorate"
                                    }
                                ]
                            }
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    
 
    const handleNoResponse = locale.addIntent({
        intentName: 'HandleNoResponse',
        description: 'Manage user response when they say no',
        sampleUtterances: [{ utterance: 'no' }],
        fulfillmentCodeHook: {
            enabled: true,
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

    // const fulfillmentFunction = new Function(stack, "FulfillmentFunction", {
    //     handler: "packages/functions/src/LexBot/intentAmazonLexFulfillment.lambda_handler",
    //     runtime: "python3.11", // SST automatically maps this
    //     memorySize: 512,
    //     timeout: 60,
    //     environment: {
    //     },
    //     permissions: ["lex"], // SST automatically configures IAM permissions
    //
    // });

    // const lexInvokeBedrock = new iam.Role(stack, 'LexInvokeBedrock', {
    //     assumedBy: new iam.ArnPrincipal('arn_for_trusted_principal'),
    //   });
    //   lexInvokeBedrock.addToPolicy(new iam.PolicyStatement({
    //     actions: [
    //       'bedrock:invokeModel',
    //   ],
    //     resources: [ "anthropic.claude-3-sonnet-20240229-v1:0" ],
    //   }));

    const fulfillmentPermission = {
        action: 'lambda:InvokeFunction',
        principal: new iam.ServicePrincipal('lex.amazonaws.com')
    }
    const fulfillmentPrincipal = new ServicePrincipal('lex.amazonaws.com')
    const fulfillmentFunction = new lambda.Function(stack, 'Fulfillment-Lambda', {
        functionName: stack.stage + '-fulfillment-lambda-for-lex-bot',
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'intentAmazonLexFulfillment.lambda_handler',
        memorySize: 512, 
        timeout: Duration.seconds(60),
        // code: lambda.Code.fromInline('print("Hello World")'),
        code: lambda.Code.fromAsset('packages/functions/src/LexBot/'),
    }); 

    fulfillmentFunction.addToRolePolicy(new iam.PolicyStatement(
        {
            effect: iam.Effect.ALLOW,
            actions: [
                "bedrock:invokeModel"
            ],
            resources: ["arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"]
        }
    ))

    // Grant permission for the Lambda function to interact with Amazon Lex
    fulfillmentFunction.grantInvoke(fulfillmentPrincipal);

    fulfillmentFunction.addPermission('lex-fulfillment', fulfillmentPermission)    // const communicationFunction = new Function(stack, "CommunicationFunction", {
    //     handler: "packages/functions/src/LexBot/communicateAmazonLexLambda.lambda_handler",
    //     runtime: "python3.11",
    //     memorySize: 512,
    //     timeout: 60,
    //     environment: {
    //         BOT_ID: bot.resource.ref,
    //     },
    //     permissions: ["lex"], // SST automatically configures IAM permissions
    // });
    // create an alias and assign it to the latest bot version
    const alias = bot.addAlias({
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
    // communicationFunction.addEnvironment("BOT_ALIAS_ID", alias.resource.ref);
    return {
        bot,
        alias
    }

}
