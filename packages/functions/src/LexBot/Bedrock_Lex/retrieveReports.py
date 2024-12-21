from botocore.exceptions import ClientError
import boto3


def get_reports(prompt, knowledgebase_id):
    # knowledgebaseId = os.getenv("KNOWLEDGEBASE_ID")
    client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")
    
    response = client.retrieve_and_generate(
        input={
            'text': prompt
        },
        retrieveAndGenerateConfiguration={
            'knowledgeBaseConfiguration': {
                'generationConfiguration': {
                    # 'additionalModelRequestFields': {
                    #     'string': {...}|[...]|123|123.4|'string'|True|None
                    # },
                    # 'guardrailConfiguration': {
                    #     'guardrailId': 'string',
                    #     'guardrailVersion': 'string'
                    # },
                    'inferenceConfig': {
                        'textInferenceConfig': {
                            'maxTokens': 123,
                            'stopSequences': [
                                'string',
                            ],
                            'temperature': 1,
                            'topP': 0.999
                        }
                    },
                    # 'promptTemplate': {
                    #     'textPromptTemplate': 'string'
                    # }
                },
                'knowledgeBaseId': knowledgebase_id,
                'modelArn': 'anthropic.claude-3-sonnet-20240229-v1:0',
                
                # 'retrievalConfiguration': {
                #     'vectorSearchConfiguration': {
                #         'filter': {
                #             'andAll': [
                #                 {'... recursive ...'},
                #             ],
                #             'equals': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'greaterThan': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'greaterThanOrEquals': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'in': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'lessThan': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'lessThanOrEquals': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'listContains': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'notEquals': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'notIn': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'orAll': [
                #                 {'... recursive ...'},
                #             ],
                #             'startsWith': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             },
                #             'stringContains': {
                #                 'key': 'string',
                #                 'value': {...}|[...]|123|123.4|'string'|True|None
                #             }
                #         },
                #         'implicitFilterConfiguration': {
                #             'metadataAttributes': [
                #                 {
                #                     'description': 'string',
                #                     'key': 'string',
                #                     'type': 'STRING'|'NUMBER'|'BOOLEAN'|'STRING_LIST'
                #                 },
                #             ],
                #             'modelArn': 'string'
                #         },
                        # 'numberOfResults': 123,
                        # 'overrideSearchType': 'HYBRID'|'SEMANTIC',
                        # 'rerankingConfiguration': {
                            # 'bedrockRerankingConfiguration': {
                                # 'metadataConfiguration': {
                                    # 'selectionMode': 'SELECTIVE'|'ALL',
                                    # 'selectiveModeConfiguration': {
                                        # 'fieldsToExclude': [
                                #             {
                                #                 'fieldName': 'string'
                                #             },
                                #         ],
                                #         'fieldsToInclude': [
                                #             {
                                #                 'fieldName': 'string'
                                #             },
                                #         ]
                                #     }
                                # },
                        #         'modelConfiguration': {
                        #             'additionalModelRequestFields': {
                        #                 'string': {...}|[...]|123|123.4|'string'|True|None
                        #             },
                        #             'modelArn': 'string'
                        #         },
                        #         'numberOfRerankedResults': 123
                        #     },
                        #     'type': 'BEDROCK_RERANKING_MODEL'
                        # }
                    # }
                # }
            },
            'type': 'KNOWLEDGE_BASE'
        },
    )

    print(response)