import { Function, Bucket, Queue, StackContext, use } from "sst/constructs";
import * as cdk from "aws-cdk-lib";
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Duration, aws_iam as iam } from "aws-cdk-lib";
import {
    LexCustomResource,
    LexBotDefinition,
} from '@amaabca/aws-lex-custom-resources';
import { BedrockStack } from "../BedrockStack";

export function BotStack({stack}: StackContext) {

    const {cfnKnowledgeBase, cfnDataSource, cfnAgent, cfnAgentAlias, cfnAgentLlama, cfnAgentAliasLlama} = use(BedrockStack);

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
            botName: stack.stackName + '-BQA-Bot',
            dataPrivacy: {
                childDirected: false,
            },
            description: 'Educational Institute Comparison and Analysis Bot for BQA',
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
            {sampleValue: {value: 'Institute'}},
        ],
    })


    const BQAIntent = locale.addIntent({
        intentName: 'BQAIntent',
        description: 'Main intent for educational institute comparison and analysis',
        sampleUtterances: [
            {utterance: 'Hello BQA'},
            {utterance: 'Hello'},
            {utterance: 'Hi'},
            { utterance: 'Hi BQA' },
            {utterance: 'Back'},              // Added Back utterance
            {utterance: 'Back to the main menu'}, // Added Back to main menu utterance
            {utterance: 'Start over'},        // Added for additional clarity
            {utterance: 'Return to menu'}, 
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    });


    BQAIntent.addSlot({
        slotName: 'BQASlot',
        slotTypeName: 'BQASlotType',
        description: 'The main menu of BQA',
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

    const analyzingIntent = locale.addIntent({
        intentName: 'AnalyzingIntent',
        description: 'Provide information about analyzing educational institutes',
        sampleUtterances: [
            { utterance: 'Tell me more about analyzing' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    });

    analyzingIntent.addSlot({
        slotName: 'InstituteTypeSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Type of educational institute to analyze',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: { 
                                buttons: [ 
                                   { 
                                      text: "University",
                                      value: "University"
                                   },
                                   { 
                                      text: "School",
                                      value: "School"
                                   },
                                   { 
                                      text: "Vocational training center",
                                      value: "Vocational training center"
                                   },
                                ],
                                title: "Which type of educational institute would you like to analyze?"
                             },
                          },
                      },
                ],
                maxRetries: 2,
            },
        },
    });
    
    analyzingIntent.addSlot({
        slotName: 'AnalyzeUniversitySlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Analyzing universities',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "Do you want to analyze based on program or standard??",
                                buttons: [
                                    {
                                        text: "Program Review",
                                        value: "Program Review"
                                    },
                                    {
                                        text: "Institutional Review",
                                        value: "Institutional Review"
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
    analyzingIntent.addSlot({
        slotName: 'ProgramNameSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Analyzing Universities based on program',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'Write the name of the programme you want to analyze.',
                            },
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    analyzingIntent.addSlot({
        slotName: 'UniNameSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Analyzing Universities based on program',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'Write the name of the University you want to analyze.',
                            },
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    analyzingIntent.addSlot({
        slotName: 'StandardProgSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Standard to analyze',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                                imageResponseCard: {
                                    title: "What is the standard of the specific program you are looking for?",
                                    buttons: [
                                        {
                                            text: "The Learning Programme",
                                            value: "The Learning Programme"
                                        },
                                        {
                                            text: "Efficiency of the Programme ",
                                            value: "Efficiency of the Programme "
                                        },
                                        {
                                            text: "Academic Standards of Students and Graduates",
                                            value: "Academic Standards of Students and Graduates"
                                        },
                                        {
                                            text: "Effectiveness of Quality Management and Assurance",
                                            value: "Effectiveness of Quality Management and Assurance"
                                        }
                                    ]
                                }
                            }
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    const uniStandard = locale.addIntent({
        intentName: 'StandardIntent',
        description: 'Intent about standards for universitites',
        sampleUtterances: [
            { utterance: 'Standard' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    });

    uniStandard.addSlot({
        slotName: 'AnalyzeUniversityNameSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Analyzing Universities for BQA',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What is the name of the University you want to analyze?',
                            },
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    uniStandard.addSlot({
        slotName: 'StandardSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Standard to analyze',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "What is the standard of the institute you are looking for?",
                                buttons: [
                                    {
                                        text: "Mission, Governance and Management",
                                        value: "Mission, Governance and Management"
                                    },
                                    {
                                        text: "Quality Assurance and Enhancement",
                                        value: "Quality Assurance and Enhancement"
                                    },
                                    {
                                        text: "Learning Resources, ICT and Infrastructure",
                                        value: "Learning Resources, ICT and Infrastructuret"
                                    },
                                    {
                                        text: "The Quality of Teaching and Learning",
                                        value: "The Quality of Teaching and Learning"
                                    },
                                    {
                                        text: "Student Support Services",
                                        value: "Student Support Services"
                                    },
                                ]
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    analyzingIntent.addSlot({
        slotName: 'AnalyzeSchoolSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Analyzing Schools for BQA',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What is the name of the school you want to analyze?',
                            },
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    analyzingIntent.addSlot({
        slotName: 'SchoolAspectSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'school aspect for BQA',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "Based on what aspect you want to analyze?",
                                buttons: [
                                    {
                                        text: "Students Academic Achievement",
                                        value: "Students Academic Achievement"
                                    },
                                    {
                                        text: "Students Personal Development and Well-being",
                                        value: "Students Personal Development and Well-being"
                                    },
                                    {
                                        text: "Teaching, Learning and Assessment",
                                        value: "Teaching, Learning and Assessment"
                                    },
                                    {
                                        text: "Leadership, Management and Governance",
                                        value: "Leadership, Management and Governance"
                                    },
                                ]
                            }
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    analyzingIntent.addSlot({
        slotName: 'AnalyzeVocationalSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Analyzing Vocational training centers for BQA',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What is the name of the Vocational training center you want to analyze?',
                            },
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    analyzingIntent.addSlot({
        slotName: 'VocationalAspectSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'vocational aspect for BQA',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "Based on what aspect you want to analyze?",
                                buttons: [
                                    {
                                        text: "Assessment and Learners",
                                        value: "Assessment and Learners"
                                    },
                                    {
                                        text: "Learners Engagement",
                                        value: "Learners Engagement"
                                    },
                                    {
                                        text: "Leadership and Management",
                                        value: "Leadership and Management"
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

    const comparingIntent = locale.addIntent({
        intentName: 'ComparingIntent',
        description: 'Provide information about comparing educational institutes',
        sampleUtterances: [
            { utterance: 'Tell me more about comparing' },
        ],
        fulfillmentCodeHook: {
            enabled: true,
        },
    });

    comparingIntent.addSlot({
        slotName: 'InstituteCompareTypeSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Type of educational institute to analyze',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: { 
                                buttons: [ 
                                   { 
                                      text: "University",
                                      value: "University"
                                   },
                                   { 
                                      text: "School",
                                      value: "School"
                                   },
                                   { 
                                      text: "Vocational training center",
                                      value: "Vocational training center"
                                   },
                                ],
                                title: "Which type of educational institute would you like to compare?"
                             },
                          },
                      },
                ],
                maxRetries: 2,
            },
        },
    })

    comparingIntent.addSlot({
        slotName: 'CompareUniStandardSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Compare universities based on universities or program',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "What is the standard of the institute you are looking for?",
                                buttons: [
                                    {
                                        text: "Mission, Governance and Management",
                                        value: "Mission, Governance and Management"
                                    },
                                    {
                                        text: "Quality Assurance and Enhancement",
                                        value: "Quality Assurance and Enhancement"
                                    },
                                    {
                                        text: "Learning Resources, ICT and Infrastructure",
                                        value: "Learning Resources, ICT and Infrastructuret"
                                    },
                                    {
                                        text: "The Quality of Teaching and Learning",
                                        value: "The Quality of Teaching and Learning"
                                    },
                                    {
                                        text: "Student Support Services",
                                        value: "Student Support Services"
                                    },
                                ]
                            }
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    comparingIntent.addSlot({
        slotName: 'CompareUniversitySlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Compare universities based on universities or program',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "would you like to compare institutes or programs within universities?",
                                buttons: [
                                    {
                                        text: "Institutional review",
                                        value: "Institutional review"
                                    },
                                    {
                                        text: "Programs",
                                        value: "Programs"
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

    comparingIntent.addSlot({
        slotName: 'CompareUniversityUniSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'names of universities to compare',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What are the names of universites you would like to compare?'
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    comparingIntent.addSlot({
        slotName: 'CompareUniversityWProgramsSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'names of universities to compare',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                                imageResponseCard: {
                                    title: "What are the programs standards you would like to compare?",
                                    buttons: [
                                        {
                                            text: "The Learning Programme",
                                            value: "The Learning Programme"
                                        },
                                        {
                                            text: "Efficiency of the Programme ",
                                            value: "Efficiency of the Programme "
                                        },
                                        {
                                            text: "Academic Standards of Students and Graduates",
                                            value: "Academic Standards of Students and Graduates"
                                        },
                                        {
                                            text: "Effectiveness of Quality Management and Assurance",
                                            value: "Effectiveness of Quality Management and Assurance"
                                        }
                                    ]
                                }
                            }
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    comparingIntent.addSlot({
        slotName: 'CompareUniversityWprogSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'names of universities to compare',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What are the names of programs you would like to compare'
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    comparingIntent.addSlot({
        slotName: 'CompareUniversityWprogUniversityNameSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'names of universities to compare',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What are the names of universities you would like to compare?'
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })


    comparingIntent.addSlot({
        slotName: 'CompareSchoolAspectlSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Compare schools for BQA',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "Based on what aspect you want to compare?",
                                buttons: [
                                    {
                                        text: "Students Academic Achievement",
                                        value: "Students Academic Achievement"
                                    },
                                    {
                                        text: "Students Personal Development and Well-being",
                                        value: "Students Personal Development and Well-being"
                                    },
                                    {
                                        text: "Teaching, Learning and Assessment",
                                        value: "Teaching, Learning and Assessment"
                                    },
                                    {
                                        text: "Leadership, Management and Governance",
                                        value: "Leadership, Management and Governance"
                                    },
                                ]
                            }
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })



    comparingIntent.addSlot({
        slotName: 'CompareSchoolSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Compare schools for BQA',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            imageResponseCard: {
                                title: "Based on what you would like to compare schools?",
                                buttons: [
                                    {
                                        text: "Governorate",
                                        value: "Governorate"
                                    },
                                    {
                                        text: "Specific Institutes",
                                        value: "Specific Institutes"
                                    },
                                    {
                                        text: "All Government Schools",
                                        value: "All Government Schools"
                                    },
                                    {
                                        text: "All Private Schools",
                                        value: "All Private Schools"
                                    },
                                ]
                            }
                        }
                    }
                ],
                maxRetries: 2
            }
        }
    })

    comparingIntent.addSlot({
        slotName: 'GovernorateSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'Select the governorate to compare institutes',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
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

    comparingIntent.addSlot({
        slotName: 'CompareSpecificInstitutesSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'names of specific institutes to compare',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What are the names of institutes you would like to compare?'
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    comparingIntent.addSlot({
        slotName: 'CompareVocationalSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'name of vocational training center to compare',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What is the names of the Vocational training centers you want to compare?'
                            }
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    })

    comparingIntent.addSlot({
        slotName: 'CompareVocationalaspectSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'name of vocational training center to compare',
        valueElicitationSetting: {
            slotConstraint: 'Optional',
            promptSpecification: {
                messageGroups: [
                    {
                            message: {
                                imageResponseCard: {
                                    title: "Based on what aspect you want to compare?",
                                    buttons: [
                                        {
                                            text: "Assessment and Learners",
                                            value: "Assessment and Learners"
                                        },
                                        {
                                            text: "Learners Engagement",
                                            value: "Learners Engagement"
                                        },
                                        {
                                            text: "Leadership and Management",
                                            value: "Leadership and Management"
                                        }
                                    ]
                                }
                            }
                        },
                ],
                maxRetries: 2,
            },
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

    otherIntent.addSlot({
        slotName: 'OtherQuestionsSlot',
        slotTypeName: 'AMAZON.FreeFormInput',
        description: 'The user\'s other questions',
        valueElicitationSetting: {
            slotConstraint: 'Required',
            promptSpecification: {
                messageGroups: [
                    {
                        message: {
                            plainTextMessage: {
                                value: 'What are the questions in your mind?',
                            },
                        },
                    },
                ],
                maxRetries: 2,
            },
        },
    });

    // const FallbackIntent = locale.addIntent({
    //     intentName: 'FallbackIntent',
    //     description: 'Default fallback intent',
    //     parentIntentSignature: 'AMAZON.FallbackIntent',
    //     fulfillmentCodeHook: {
    //         enabled: true,
    //     },
    //     dialogCodeHook: {
    //         enabled: true
    //     }
    // });
    
    // FallbackIntent.addSlot({
    //     slotName: 'FallbackContext',
    //     slotTypeName: 'BQASlotType',
    //     valueElicitationSetting: {
    //         slotConstraint: 'Required',
    //         promptSpecification: {
    //             messageGroups: [{
    //                 message: {
    //                     imageResponseCard: {
    //                         buttons: [
    //                             { text: "Analyze", value: "Analyze" },
    //                             { text: "Compare", value: "Compare" },
    //                             { text: "Other", value: "Other" }
    //                         ],
    //                         subtitle: "I didn't quite understand. What would you like me to do for you?",
    //                         title: "Learn About Educational Institutes"
    //                     },
    //                 },
    //             }],
    //             maxRetries: 2,
    //             allowInterrupt: true
    //         }
    //     }
    // });

    const bot = botDefinition.build();
    const version = bot.automaticVersion();
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
        environment: {
            agentId: cfnAgent.attrAgentId,
            agentAliasId: cfnAgentAlias.attrAgentAliasId,
            KNOWLEDGEBASE_ID: cfnKnowledgeBase.attrKnowledgeBaseId,
            llamaAgentId: cfnAgentLlama.attrAgentId,
            llamaAgentAliasId: cfnAgentAliasLlama.attrAgentAliasId,
        },
        
    }); 

    fulfillmentFunction.addToRolePolicy(new iam.PolicyStatement(
        {
            effect: iam.Effect.ALLOW,
            actions: [
                "bedrock:invokeModel"
            ],
            resources: ["arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"]
        }
    ))

    fulfillmentFunction.addToRolePolicy(new iam.PolicyStatement(
        {
            effect: iam.Effect.ALLOW,
            actions: [
                "bedrock:InvokeAgent",
                "bedrock:*"
            ],
            resources: ["*"] // TODO: change it to be dynamic
        }
    ))

    // Grant permission for the Lambda function to interact with Amazon Lex
    fulfillmentFunction.grantInvoke(fulfillmentPrincipal);

    fulfillmentFunction.addPermission('lex-fulfillment', fulfillmentPermission)    
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
    return {
        bot,
        alias
    }

}