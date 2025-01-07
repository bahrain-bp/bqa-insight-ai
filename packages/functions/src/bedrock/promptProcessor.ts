import { 
  createComparePrompt, createAnalyzeSchoolPrompt, createCompareSchoolsPrompt, 
  createAnalyzeUniversityPrompt, createCompareUniversityPrompt,
  createAnalyzeVocationalTrainingCenter, createCompareVocationalTrainingCenter 
} from './prompts';

// Define types for institute type (school, university, or vocational) and action type (analyze or compare)
type InstituteType = 'school' | 'university' | 'vocational';
type ActionType = 'analyze' | 'compare';

// Define an interface for the prompt parameters
interface PromptParams {
action: ActionType;               // Action type (analyze or compare)
instituteType: InstituteType;     // Type of institute (school, university, or vocational)
instituteName?: string;           // Name of the institute (optional)
instituteNames?: string;          // Multiple names of institutes (optional)
programme?: string;               // Name of the programme (optional)
metric?: string;                  // Metric to use (optional)
governorate?: boolean;            // Whether to include governorate information (optional)
}

// Define the interface for the input required to process the prompt
interface ProcessPromptInput {
userMessage: string;               // User's message (input string)
educationType: string;             // Type of education (school, university, or vocational)
classification: string[];          // Classifications to filter by
level: string[];                   // Levels to filter by (primary, secondary, etc.)
location: string[];                // Locations to filter by
instituteName: string[];           // Names of institutes to filter by
reportYear: string[];              // Report years to filter by
}

// Function to detect the type of institute (school, university, or vocational) based on the user input
function detectInstituteType(input: string): InstituteType {
console.log(' Detecting institute type from input:', input);

if (!input) {
  console.log('No input provided, defaulting to school type');
  return 'school';  // Default to 'school' if no input is provided
}

const lowerInput = input.toLowerCase(); // Convert input to lowercase for easier matching

// Universities usually have these keywords
if (lowerInput.includes('university') || 
    lowerInput.includes('college') || 
    lowerInput.includes('bachelor') || 
    lowerInput.includes('programme')) {
  console.log('Detected type: university');
  return 'university';  // If the input contains keywords related to universities, return 'university'
}

// Vocational centers usually have these keywords
if (lowerInput.includes('vocational') || 
    lowerInput.includes('training center') || 
    lowerInput.includes('institute of training')) {
  console.log('Detected type: vocational');
  return 'vocational';  // If the input contains keywords related to vocational centers, return 'vocational'
}

console.log('Detected type: school');
return 'school';  // Default to 'school' if no match for university or vocational
}

// Function to detect the action (analyze or compare) based on the user input
function detectAction(input: string): ActionType {
console.log('Detecting action from input:', input);

if (!input) {
  console.log('No input provided, defaulting to analyze action');
  return 'analyze';  // Default to 'analyze' if no input is provided
}

const lowerInput = input.toLowerCase();  // Convert input to lowercase for easier matching

// If the input contains words like 'compare', 'versus', 'vs', or 'between', return 'compare'
if (lowerInput.includes('compare') || 
    lowerInput.includes('versus') || 
    lowerInput.includes('vs') || 
    lowerInput.includes('between')) {
  console.log('Detected action: compare');
  return 'compare';
}

console.log('Detected action: analyze');
return 'analyze';  // Default to 'analyze' if no comparison keywords are found
}

// Function to generate a prompt based on the action and institute type
function generatePrompt(params: PromptParams): string {
  
  const { action, instituteType, instituteName, instituteNames, programme, metric, governorate } = params;

// Switch based on the institute type (school, university, or vocational)
switch (instituteType) {
  case 'school':
    // If action is 'compare', generate a compare prompt; otherwise, generate an analyze prompt
    if (action === 'compare') {
      return createCompareSchoolsPrompt(instituteNames, governorate); // Compare prompt for schools
    }
    return createAnalyzeSchoolPrompt(instituteName || '');  // Analyze prompt for school
  
  case 'university':
    if (action === 'compare') {
      return createCompareUniversityPrompt(programme || '', instituteNames || ''); // Compare prompt for universities
    }
    return createAnalyzeUniversityPrompt(programme || '', instituteName || '');  // Analyze prompt for university
  
  case 'vocational':
    if (action === 'compare') {
      return createCompareVocationalTrainingCenter(instituteNames || ''); // Compare prompt for vocational centers
    }
    return createAnalyzeVocationalTrainingCenter(instituteName || '');  // Analyze prompt for vocational center
  
  default:
    throw new Error('Invalid institute type');  // Throw an error if the institute type is invalid
}
}

// Main function to process the prompt input and generate the appropriate prompt
export function processPrompt(input: ProcessPromptInput): string {

const instituteType = detectInstituteType(input.userMessage); // Detect the institute type based on the user message

const action = detectAction(input.userMessage); // Detect the action based on the user message

// Create the prompt parameters based on the detected institute type and action
const promptParams: PromptParams = {
  action,
  instituteType,
  instituteName: input.instituteName?.[0],  // Use the first institute name if available
  instituteNames: input.instituteName?.join(', '),  // Join multiple institute names if provided
  programme: undefined,  // Programme is not specified here but can be added if necessary
  metric: undefined,     // Metric is not specified here but can be added if necessary
  governorate: false    // Governorate information is not included by default
};


// Generate the final prompt based on the parameters
const finalPrompt = generatePrompt(promptParams);

return finalPrompt;  // Return the final generated prompt
}
