import { createComparePrompt, createAnalyzeSchoolPrompt, createCompareSchoolsPrompt, 
    createAnalyzeUniversityPrompt, createCompareUniversityPrompt,
    createAnalyzeVocationalTrainingCenter, createCompareVocationalTrainingCenter } from './prompts';

type InstituteType = 'school' | 'university' | 'vocational';
type ActionType = 'analyze' | 'compare';

interface PromptParams {
  action: ActionType;
  instituteType: InstituteType;
  instituteName?: string;
  instituteNames?: string;
  programme?: string;
  metric?: string;
  governorate?: boolean;
}

interface ProcessPromptInput {
  userMessage: string;
  educationType: string;
  classification: string[];
  level: string[];
  location: string[];
  instituteName: string[];
  reportYear: string[];
}

function detectInstituteType(input: string): InstituteType {
  console.log('🔍 Detecting institute type from input:', input);
  
  if (!input) {
    console.log('⚠️ No input provided, defaulting to school type');
    return 'school';
  }

  const lowerInput = input.toLowerCase();

  // Universities usually have these keywords
  if (lowerInput.includes('university') || 
      lowerInput.includes('college') || 
      lowerInput.includes('bachelor') || 
      lowerInput.includes('programme')) {
    console.log('🎓 Detected type: university');
    return 'university';
  }

  // Vocational centers usually have these keywords
  if (lowerInput.includes('vocational') || 
      lowerInput.includes('training center') || 
      lowerInput.includes('institute of training')) {
    console.log('🔧 Detected type: vocational');
    return 'vocational';
  }

  console.log('Detected type: school');
  return 'school';
}

function detectAction(input: string): ActionType {
  console.log('Detecting action from input:', input);
  
  if (!input) {
    console.log('⚠️ No input provided, defaulting to analyze action');
    return 'analyze';
  }

  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('compare') || 
      lowerInput.includes('versus') || 
      lowerInput.includes('vs') || 
      lowerInput.includes('between')) {
    console.log(' Detected action: compare');
    return 'compare';
  }

  console.log('Detected action: analyze');
  return 'analyze';
}

function generatePrompt(params: PromptParams): string {
  console.log('⚙️ Generating prompt with params:', JSON.stringify(params, null, 2));
  
  const { action, instituteType, instituteName, instituteNames, programme, metric, governorate } = params;

  switch (instituteType) {
    case 'school':
      if (action === 'compare') {
        return createCompareSchoolsPrompt(instituteNames, governorate);
      }
      return createAnalyzeSchoolPrompt(instituteName || '');
    
    case 'university':
      if (action === 'compare') {
        return createCompareUniversityPrompt(programme || '', instituteNames || '');
      }
      return createAnalyzeUniversityPrompt(programme || '', instituteName || '');
    
    case 'vocational':
      if (action === 'compare') {
        return createCompareVocationalTrainingCenter(instituteNames || '');
      }
      return createAnalyzeVocationalTrainingCenter(instituteName || '');
    
    default:
      throw new Error('Invalid institute type');
  }
}

export function processPrompt(input: ProcessPromptInput): string {
  console.log('Starting prompt processing with input:', JSON.stringify(input, null, 2));
  
  const instituteType = detectInstituteType(input.userMessage);
  console.log(' Determined institute type:', instituteType);
  
  const action = detectAction(input.userMessage);
  console.log('Determined action:', action);

  const promptParams: PromptParams = {
    action,
    instituteType,
    instituteName: input.instituteName?.[0],
    instituteNames: input.instituteName?.join(', '),
    programme: undefined,
    metric: undefined,
    governorate: false
  };
  
  console.log('Created prompt parameters:', JSON.stringify(promptParams, null, 2));
  
  const finalPrompt = generatePrompt(promptParams);
  console.log('Generated final prompt:', finalPrompt);
  
  return finalPrompt;
}