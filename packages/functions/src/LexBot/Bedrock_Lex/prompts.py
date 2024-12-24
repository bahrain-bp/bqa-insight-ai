# TODO: change the questions in compare prompt and others
def create_compare_prompt(instituite_name, metric, governorate=False):
    prompt = f'''
         Goal :  To evaluate and categorize trends in Bahrain's educational sector across government and private schools, focusing on areas such as students' academic achievement, personal development and well-being, teaching and learning quality, and leadership and governance. The aim is to derive actionable insights into performance, enrollment, and other relevant trends.
        Input 1
        Question: What are the improvement areas in the government schools this year?
        Output:
        Classification: Government schools
        Insights: Key improvement areas identified in government schools this year include:
        1. Enhancing students' academic achievement through additional STEM programs.
        2. Promoting students' personal development with counseling and extracurricular activities.
        3. Improving teaching quality by offering professional development workshops for teachers.
        4. Strengthening leadership and governance through the introduction of school performance audits.
        Input 2
        Question: What are the improvement areas in private schools in the past years?
        Output:
        Classification: Private schools
        Insights:In recent years, private schools have focused on:
        1. Boosting academic results by introducing international curricula such as IB and Cambridge standards.
        2. Supporting student well-being through wellness programs and mental health initiatives.
        3. Adopting modern teaching methods, including project-based learning and digital tools.
        4. Enhancing governance through partnerships with international accreditation.
        Input 3
        Question: What are the government schools doing this year to achieve an outstanding grade?
        Output:
        Classification: Government schools
        Insights:Government schools are implementing strategies to secure outstanding ratings, such as:
        1. Introducing rigorous assessment practices to monitor student progress.
        2. Fostering collaboration between teachers and parents to improve learning outcomes.
        3. Developing leadership skills among administrators through advanced training programs.
        4. Creating inclusive classrooms to address diverse learning needs.
        Input 4
        Question: What are the improvements in private schools compared to government schools?
        Output:
        Classification: Comparative analysis (Private and Government schools)
        Insights:Private schools show advancements in personalized learning approaches and integration of advanced technology, such as AI-driven learning tools, while government schools have prioritized infrastructure development and STEM curriculum updates. Both sectors have made strides in enhancing student well-being programs, though private schools lead in adopting globally recognized teaching frameworks.
        Input: How did {instituite_name} do in terms of {metric}?
    '''
    return prompt


def create_analyze_prompt(instituite_name, metric):
    prompt = f"""
        Goal: To analyze the improvements and declines of individual educational institutes in Bahrain, focusing on specific actions taken, challenges faced, and actionable strategies to enhance their overall performance in areas such as academic achievement, personal development, teaching quality, and governance.

        Input 1
        Question: What improvements did Al Bayan School achieve this year?
        Output:
        Classification: Individual school analysis (Al Bayan School)
        Insights: Key improvements achieved by Al Bayan School this year include:
        1. Introduction of a new STEM curriculum to enhance science and technology learning.
        2. Implementation of a student mentoring program to support personal development.
        3. Upgrading classroom technology with smart boards and digital tools.
        4. Launching professional development workshops for teachers focused on differentiated instruction.

        Input 2
        Question: What are the key declines observed in Al Bayan School this year?
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

        Question: How did {instituite_name} perform in terms of {metric}
    """
    return prompt


def create_uni_analyze_prompt():
    prompt = f"""
        Your goal is to analyze the provided educational institute report and provide insights on the University overall performance based on the different standards and judgment.
        Use this data for your report: <data>{text}</data>.

        <instructions>
        1. Ensure that the output contains all the insightful information.
        2. Do not say that you did not find any information.
        </instructions>

        Input 1
        Question: How is the Student Support Services Standard in Arab Open University?
        Output: The Student Support Services Standard at the Arab Open University (AOU) has been judged as addressed, meaning that the University meets the required quality standards in this area. Here are the key findings and recommendations:

        Key Strengths:
        Support Systems: The University has mechanisms in place to address students' academic and non-academic needs effectively.
        Feedback Utilization: AOU employs surveys such as Alumni Surveys and Student Feedback Surveys to gather insights and improve its student services.
        Inclusive Facilities: Benchmarking efforts include a focus on services for special needs students, comparing AOU Bahrain to other local and regional institutions.
        Accessible Processes: Students benefit from clear support channels, including systems for handling appeals, feedback, and complaints.
        Areas for Enhancement:
        Benchmarking Practices: The report suggests adopting broader and more rigorous benchmarking practices to better encompass all aspects of student services.
        Data Utilization: While feedback is collected effectively, there is room for improvement in using this data to continuously enhance the quality of services offered.
        Workplace Engagement Feedback: Enhanced efforts to gather and act upon feedback from employers regarding graduates’ preparedness could strengthen the alignment of student support services with market needs.
        Recommendations:
        Expand Benchmarking Practices: To include all academic and administrative services comprehensively, ensuring improvements are based on reliable comparisons.
        Optimize Feedback Use: Better integrate feedback from surveys into strategic planning and enhancement initiatives for student services.
        The Student Support Services Standard reflects a positive evaluation overall, with clear opportunities for further development in aligning student services with both internal and external stakeholder needs.

        Input 2
        Question: How is the Quality of Teaching and Learning Standard in Bahrain Polytechnic?
        Output: The Quality of Teaching and Learning Standard at Bahrain Polytechnic has been judged as addressed, meaning the institution meets the required quality standards in this area. Below are the key findings and recommendations:

        Key Strengths:
        Teaching Philosophy and Strategies:
        - Bahrain Polytechnic employs a teaching and learning (T&L) philosophy emphasizing problem-based learning (PBL), project-based learning, and collaborative approaches.
        - Critical thinking and independent learning are core focuses across programs.

        Implementation and Review:
        - A T&L policy is in place to provide unified guidance across faculties, ensuring alignment with institutional goals.
        - Mechanisms for monitoring teaching effectiveness include staff induction, biannual T&L symposiums, and regular program reviews.

        Work-Based Learning (WBL):
        - Strong links with industry ensure practical, real-world learning for students, preparing them for the labor market.
        - Seven academic programs include workplace learning activities, assessed collaboratively by faculty and industry supervisors.

        Areas for Enhancement:
        Unified Mechanism for WBL:
        - Each program implements WBL independently, and there is no institution-wide system for monitoring or improving WBL experiences.

        Policy Reviews:
        - The T&L policy is scheduled for review every four years, but a structured process to track review outcomes and enhancements could strengthen its implementation.

        Recommendations:
        1. Develop a Unified WBL Mechanism: Create a standardized system across faculties to monitor and improve students’ work-based learning experiences.
        2. Enhance Review Processes: Ensure structured follow-ups to review outcomes for the T&L policy and other related frameworks.

        The Quality of Teaching and Learning Standard reflects strong institutional commitment and effective implementation, with opportunities for growth in systematizing processes and leveraging WBL for greater consistency.

        Input 3
        Question: How is the Community Engagement Standard in Ahlia University?
        Output:
        The Community Engagement Standard at Ahlia University has been judged as addressed, reflecting the institution's commitment to meeting the required quality standards. Below are the key strengths and recommendations:

        Key Strengths:
        Strategic Integration:
        - Community engagement is aligned with the university’s mission and strategic goals, ensuring that initiatives contribute meaningfully to societal development.
        - Ahlia University has a structured approach to community engagement, including outreach programs and partnerships with external organizations.

        Wide Range of Activities:
        - The university offers various initiatives, such as workshops, conferences, and training programs, aimed at addressing the needs of the local community.
        - Engagement includes cultural, educational, and social development activities that promote lifelong learning.

        Stakeholder Involvement:
        - Strong emphasis is placed on collaboration with external stakeholders, including businesses, public institutions, and non-governmental organizations, to enhance the impact of community engagement efforts.

        Recommendations:
        1. Monitoring and Assessment: Develop a robust mechanism to regularly evaluate the effectiveness and impact of community engagement activities.
        2. Documentation and Reporting: Ensure that all community engagement activities are well-documented and publicly reported to highlight achievements and areas for improvement.

        Conclusion:
        The Community Engagement Standard at Ahlia University demonstrates a commendable alignment with institutional priorities and societal needs. The structured approach and focus on collaboration underline its commitment to meaningful contributions, with opportunities for enhanced monitoring and impact evaluation.

        Input 4
        Question: How is the Learning Resources, ICT and Infrastructure Standard in University of Bahrain?
        Output: The Learning Resources, ICT, and Infrastructure Standard at the University of Bahrain has been judged as addressed, reflecting the institution's ability to meet the required quality standards effectively. Below are the key strengths and recommendations:

        Key Strengths:
        Library and Learning Resources:
        - The University of Bahrain maintains six libraries across three campuses, including a digital library, which provide a balanced collection of print and electronic resources to support teaching, learning, and research activities.
        - Libraries are equipped with study spaces, computers, and group study rooms, and future plans include the development of a large Engineering library.
        - Active engagement with faculty and students ensures the alignment of library resources with academic needs, with continuous feedback mechanisms through surveys.

        Information and Communication Technology (ICT):
        - The IT Centre follows a robust operational plan, including disaster recovery, maintenance, and the replacement of ICT resources.
        - The Digital Smart Campus strategy emphasizes digital transformation, focusing on cloud infrastructure, customer support, business process automation, and enhanced information management.
        - ICT services, including the Student Information System (SIS) and online helpdesk, ensure effective support for academic and administrative operations.

        Physical Infrastructure:
        - Infrastructure developments at the Sakhir campus demonstrate the University's commitment to providing modern, functional facilities for its students and staff.
        - Adequate space, accessible resources, and 24/7 digital library services underline the institution's dedication to meeting the needs of its community.

        Recommendations:
        1. Continue enhancing ICT systems to integrate the latest technological advancements, ensuring alignment with academic and administrative requirements.
        2. Develop mechanisms to assess and further improve the utilization of library resources among all stakeholders, particularly through targeted workshops and feedback sessions.
        3. Monitor and evaluate the effectiveness of new infrastructure developments to ensure they meet the intended goals.

        Conclusion:
        The Learning Resources, ICT, and Infrastructure Standard at the University of Bahrain is well-aligned with the institution's goals to support its academic and administrative operations. Continuous improvement and strategic investment in infrastructure and digital transformation solidify its commitment to quality and effectiveness.

        Input: How is the {standard} Standard in {institute_name}?          
        Output:
        The {standard} Standard at the {institute_name} has been judged as ....
        Key Strengths:

        Title 1:
        - 
        - 
        - 

        Title 2:
        - 
        - 
        -

        Title 3:
        - 
        -

        Recommendations:
        1.
        2.
        3.
        Conclusion:
    """

    return prompt



def create_compare_uni_prompt():
    prompt = f"""
        Your goal is to compare between the provided educational institutes reports and provide insights on the Universities' overall performance based on the different standards and judgments.

        <instructions>
        1. Ensure that the output contains all the insightful information.
        2. Do not use the below Input Output in your response to different questions.
        </instructions>

        Input 1
        Question: Compare between The Quality of Teaching and Learning Standard of Bahrain Polytechnic and Ahlia University.
        Output:
        The comparison between the Quality of Teaching and Learning Standards of Bahrain Polytechnic and Ahlia University is based on their institutional review reports. Here's a summarized analysis:

        Common Elements:
        Alignment with Core Functions:

        Both Bahrain Polytechnic and Ahlia University emphasize teaching and learning as core functions alongside research and community engagement.
        Judgment on Quality:

        Both institutions successfully meet the quality assurance requirements for teaching and learning, achieving a judgment of "addressed" in their respective reviews.
        Standardized Evaluation:

        Both institutions adhere to predefined indicators and standards to measure teaching quality, such as programme management, student assessment, and learning outcomes.
        Differences:
        1. Approach to Programme Management:
        Bahrain Polytechnic:
        Integrates Problem-Based Learning (PBL), focusing on applied skills and preparing graduates for the industry.
        Ahlia University:
        Highlights partnerships with international universities to enhance teaching quality and align with global academic standards.
        2. Assessment and Moderation:
        Bahrain Polytechnic:
        Adopts a robust moderation policy with clear audit trails for assessments, ensuring consistency and reliability in evaluation.
        Ahlia University:
        Uses an Assessment Manual and emphasizes plagiarism deterrence through tools like Turnitin to maintain academic integrity.
        3. Recognition of Prior Learning:
        Both institutions address this indicator but differ in implementation frameworks. Bahrain Polytechnic’s system suggests a more integrated and systematic approach compared to Ahlia University.
        4. Unique Quality Features:
        Bahrain Polytechnic:
        Focuses on continuous improvement through a structured Quality Improvement Plan (QIP), showcasing a methodical approach to feedback and enhancement.
        Ahlia University:
        Relies on its Centre for Accreditation and Quality Assurance (CAQA) to monitor and review teaching quality measures.
        Recommendations and Observations:
        Ahlia University:
        Recommendation: Expedite the development and implementation of comprehensive procedures for penalties on academic misconduct to enhance deterrence and maintain integrity.
        Bahrain Polytechnic:
        Recommendation: Strengthen follow-up on internal and external audit measures to address gaps in resource allocation and ensure sustained quality
"""

def create_generate_json_prompt(data):
    heading = """ Your goal is to analyze the given text and provide a relevant title in relation to the given text in JSON format. 
        Then, extract data from the given text appropriate for chart generation. The chart data you provide must include unified 
        column names and corresponding values extracted from the analysis, meaning unified points, in JSON format. After that, 
        provide a chart type (whether it be a line chart, bar graph, scatter line chart, or pie chart) that is the optimum choice 
        to display the chart data you generated after analyzing the given text in JSON format. Please follow the format given 
        exactly, but the number of rows could be higher or lower depending on the relevant chart data in JSON format, and columns 
        must have relevant titles. If there is a range of data, like "...grades 9-10", please type it as individual rows, 
        like "grade: 9, grade: 10"."""
    
    instructions = """<instructions>
            1. Do not add any clarifying information.
            2. Use the specified schema and use x and y for column and values.
        </instructions>"""
    
    formatting = """<formatting>
            {
                "type": "line",        
                    "datasets": [
                        {
                            "label": "Jidhafs Intermediate Boys School",
                            "data": {
                                "2012": 1,
                                "2014": 2,
                                "2017": 2,
                                "2019": 3,
                                "2022": 4
                            },
                        },
                        {
                            "label": "Al Sehlah Intermediate Boys School",
                            "data": {
                                "2011": 4,
                                "2014": 4,
                                "2018": 3,
                                "2023": 3
                            },
                        },
                        {
                            "label": "Hamad Town Intermediate Boys School",
                            "data": {
                                "2011": 1,
                                "2014": 1,
                                "2016": 3,
                                "2023": 4
                            },
                        }
                    ]
            }
            </formatting>"""


    prompt = f'''
        {heading}
        {instructions}
        {formatting}
        Given text: 
        <text>
            {data}
        </text>
    '''
    
    return prompt

# def create_generate_json_prompt(data):
#     heading = """
#     Your objective is to meticulously analyze the provided text, which is Claude's Sonnet 3, and generate a structured JSON output following the specified schema.
    
#     1. **Title Extraction**: Derive a relevant and concise title that encapsulates the essence of the sonnet.
    
#     2. **Data Extraction for Chart Generation**:
#         - Identify key thematic elements, literary devices, or metrics pertinent to the sonnet.
#         - Organize the extracted data with unified column names (`x` for categories and `y` for corresponding values).
#         - Ensure that each data point is represented individually, especially when dealing with ranges or multiple related elements.
    
#     3. **Optimal Chart Type Recommendation**:
#         - Analyze the extracted data to determine the most suitable chart type (e.g., line chart, bar graph, scatter plot, pie chart) that effectively visualizes the information.
    
#     **Please adhere strictly to the JSON structure provided below. The number of rows may vary based on the data extracted, but ensure that all columns are aptly titled and relevant.**
#     """
    
#     instructions = """
#     <instructions>
#         1. Do not include any additional or clarifying information beyond what is specified.
#         2. Utilize the provided schema accurately, using 'x' for column categories and 'y' for their corresponding values.
#         3. Maintain consistency in data representation, especially for ranges or grouped items.
#     </instructions>
#     """
    
#     formatting = """
#     <formatting>
#     {
#         "title": "Your Extracted Title Here",
#         "chartData": {
#             "columns": ["x", "y"],
#             "rows": [
#                 {"x": "Category 1", "y": Value1},
#                 {"x": "Category 2", "y": Value2},
#                 // Add more rows as necessary
#             ]
#         },
#         "chartType": "bar" // Choose from "line", "bar", "scatter", "pie"
#     }
#     </formatting>
#     """
    
#     prompt = f'''
#     {heading}
#     {instructions}
#     {formatting}
#     Given text: 
#     <text>
#         {data}
#     </text>
#     '''
    
#     return prompt