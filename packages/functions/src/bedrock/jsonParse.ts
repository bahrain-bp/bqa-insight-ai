//Parsing function to extract the JSON formatted output from the model response
export function jsonParse(input: string): string {
  // Extract JSON part in case the model returned extra text with the JSON output
  const jsonRegex = /{([\s\S]*?)}/;
  const extractedJson = input.match(jsonRegex);

  if (!extractedJson) {
    throw new Error("No JSON-like structure found in the input.");
  }

  // Parse the input string into a JSON object
  const parsedData = JSON.parse(extractedJson[0]);

  // Ensure the parsed data is an object
  if (typeof parsedData !== "object" || parsedData === null) {
    throw new Error("Input is not a valid JSON object.");
  }

  return parsedData;
}
