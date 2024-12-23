
import { BedrockAgentRuntimeClient,InvokeAgentCommand,} from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayEvent } from "aws-lambda";
import { generateJson } from "./generatejson";


 export const invokeBedrockAgent = async (event: APIGatewayEvent) => {
            const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

            const agentId = process.env.AGENT_ID;
            const agentAliasId = process.env.AGENT_ALIAS_ID;
            const sessionId = "123";


            try {
              const filterParams = JSON.parse(event.body || "{}");
              console.log(filterParams, ": is prompt");
              
              if (!filterParams) {
                throw new Error('Text not provided');
              }

            const command = new InvokeAgentCommand({
              agentId,
              agentAliasId,
              sessionId,
              inputText: 
              `Goal: To analyze the improvements and declines of individual educational institutes in Bahrain,
               focusing on specific actions taken, challenges faced, and actionable strategies to enhance their overall performance in areas such as academic achievement, personal development, teaching quality, and governance.

                      Input 1
                      Question: What improvements did Al Bayan School achieve this year?
                      Output:
                      Classification: Individual school analysis (Al Bayan School)
                      Insights: Key improvements achieved by Al Bayan School this year include:
                      1. Introduction of a new STEM curriculum to enhance science and technology learning.
                      2. Implementation of a student mentoring program to support personal development.
                      3. Upgrading classroom technology with smart boards and digital tools.
                      4. Launching professional development workshops for teachers focused on differentiated instruction.

                      Input 2                                                                                                                                           Question: What are the key declines observed in Al Bayan School this year?
                      Output:
                      Classification: Individual school analysis (Al Bayan School)
                      Insights: Declines observed at Al Bayan School this year include:
                      1. A decrease in extracurricular activity participation due to increased academic pressure.
                      2. Higher teacher turnover rates compared to previous years, impacting classroom stability.
                      3. Challenges in maintaining consistent student performance in mathematics.
                      4. Reduced parent engagement in school activities and decision-making processes.

                      Input 3
                      Question: What are the improvements and declines observed at Ibn Khuldoon National School?
                      Output:
                      Classification: Individual school analysis (Ibn Khuldoon National School)
                      Insights: Performance at Ibn Khuldoon National School shows:
                      Improvements:
                      1. Enhanced student well-being through the introduction of mindfulness and mental health programs.
                      2. Increased enrollment due to new marketing campaigns and reputation building.
                      3. Adoption of international curricula like IB, improving global competitiveness.
                      4. Successful completion of infrastructure renovations, providing better facilities for students.
                      Declines:
                      1. Limited access to advanced extracurricular programs due to budget constraints.
                      2. Difficulty retaining senior teaching staff, leading to increased recruitment costs.
                      3. Reports of inconsistent academic results in science and humanities subjects.
                      4. Reduced opportunities for international student exchange programs due to logistical issues.

                      Input 4
                      Question: What are the strategies proposed for Al Noor International School to address its challenges?
                      Output:
                      Classification: Individual school analysis (Al Noor International School)
                      Insights: Strategies proposed for Al Noor International School include:
                      1. Improving Student Outcomes: Introducing peer tutoring programs and after-school academic support.
                      2. Teacher Retention: Offering performance bonuses and professional growth opportunities to reduce turnover.
                      3. Parental Involvement: Hosting regular parent-teacher forums to increase engagement.
                      4. Extracurricular Development: Securing sponsorships to enhance funding for clubs and competitions.

                      Input 5
                      Question: How do Al Hekma International School’s improvements compare to its declines this year?
                      Output:
                      Classification: Individual school analysis (Al Hekma International School)
                      Insights: Al Hekma International School’s performance reveals:
                      Improvements:
                      1. Improved student-teacher ratios by hiring additional staff.
                      2. Introduction of advanced placement courses, providing students with college-level learning opportunities.
                      3. Successful rollout of a new digital library system, enhancing research capabilities.
                      4. Establishment of a student council to promote leadership and advocacy skills.
                      Declines:
                      1. Decrease in student attendance rates attributed to transportation issues.
                      2. Challenges in maintaining consistent quality across grade levels due to curriculum changes.
                      3. Limited participation in regional academic competitions compared to prior years.
                      4. Strained teacher-student relationships in some grades due to communication gaps.

                      Input 6
                      Question: What actionable steps can be taken to address declines across Bahrain’s educational institutes?
                      Output:
                      Classification: Sector-wide recommendations
                      Insights: To address common challenges, educational institutes in Bahrain can implement the following steps:
                      1. Teacher Retention: Develop competitive salary packages and continuous training opportunities.
                      2. Student Engagement: Foster interest through dynamic extracurricular activities and modern teaching methods.
                      3. Infrastructure Upgrades: Allocate funding for renovation and technology integration in classrooms.
                      4. Parental Involvement: Build stronger school-community ties through regular communication and feedback mechanisms.
                      5. Academic Excellence: Invest in data-driven approaches to track and improve student performance in core subjects.

                      Question: What is the performance of ${filterParams["instituteName"]}?

                      `,  // Send the prompt to Bedrock

             });

    try {
        let completion = "";
        const response = await client.send(command);
    
        if (response.completion === undefined) {
          throw new Error("Completion is undefined");
        }
    
        let hasChunks = false;
        var decodedResponse = "";
        for await (const chunkEvent of response.completion) {
          const chunk = chunkEvent.chunk;
          
          if (chunk !== undefined && chunk.bytes) {
            hasChunks = true;
            decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
            completion += decodedResponse;
          } else {
            console.warn("Received an empty chunk or chunk with no bytes");
          }
        }
    
        if (!hasChunks) {
          throw new Error("No chunks received in the response");
        }
        

        const generatedJson = generateJson(decodedResponse)
         return {
          statusCode: 200,
          body: JSON.stringify({
             message: 'Received Output from Bedrock',
             response: JSON.parse(decodedResponse).result  // Handle the result here
            }),
        };
      } catch (err) {
        console.error("Error invoking Bedrock agent:", err);
        return undefined;
      }
  } catch (error) {
    console.log(error);
  }
};
