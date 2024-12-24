# TODO: change the questions in compare prompt and others
def create_compare_schools_prompt(institute_names, aspect="overall effectiveness", governorate=False):
    prompt = f'''
        
Goal: To evaluate and categorize trends in Bahrain's educational sector across government and private schools, focusing on areas such as students' academic achievement, personal development and well-being, teaching and learning quality, and leadership and governance. The aim is to derive actionable insights into performance, enrollment, and other relevant trends.

    <instructions>
    1. Ensure that the output contains all the insightful information.
    2. Do not say that you did not find any information.
    3. Do not add very negative comments that can ruin the educational instituite reputation. Add constructive ffedback only.
    </instructions>

    Input 1
    Question: How Did alrawabi private school and Pakistan Urdu School do in terms of overall effectiveness?
    Output:
    Al Rawabi Private School

    Overall Effectiveness: Satisfactory
    Key Judgements:

    Academic Achievement:
        High pass rates in internal examinations for Primary and Intermediate schools, but inconsistent performance in High School external exams, particularly in science subjects.
        Proficiency rates were satisfactory across levels, though High School students faced challenges in rigorous subjects like chemistry and physics.
        Students' learning skills, particularly critical thinking and technological competencies, were underdeveloped.

    Teaching, Learning, and Assessment:
        Teachers use diverse strategies, but their effectiveness varied significantly, especially in High School.
        Assessments and feedback mechanisms require better alignment to individual student needs, particularly for low achievers.

    Leadership and Governance:
        Regular self-evaluation and strategic planning exist, but operational plans lack robust alignment with priorities.
        High staff turnover impacts professional development program effectiveness.

    Student Personal Development:
        Students exhibit good discipline and respect, engaging in activities that promote social responsibility.
        Opportunities for leadership development in lessons are limited

    Comparative Insights:

    Al Rawabi Private School excels in providing a broad curriculum but struggles with High School performance and teacher retention.
    Pakistan Urdu School demonstrates stronger academic outcomes in senior grades but requires improvements in integrating critical thinking and modern teaching tools.

    Both schools show a commitment to improving their educational quality but need to address their respective challenges for sustained growth.

    Input 2
    Question: What are the improvement areas in private schools in the past years?
    Output:
    Private schools in Bahrain have focused on significant improvements in recent years:

    Key Strengths:
    Academic Results:
    - Boosting academic performance by adopting international curricula such as IB and Cambridge standards.

    Student Well-being:
    - Supporting student well-being through wellness programs, mental health initiatives, and mindfulness activities.

    Modern Teaching Methods:
    - Adopting innovative teaching techniques, including project-based learning and digital tools integration.

    Governance:
    - Enhancing governance practices through partnerships with international accreditation organizations.

    Input 3
    Question: What are the government schools doing this year to achieve an outstanding grade?
    Output:
    Government schools are actively implementing strategies to achieve outstanding ratings:

    Key Strategies:
    Student Progress Monitoring:
    - Introducing rigorous assessment practices to track and improve student progress.

    Teacher-Parent Collaboration:
    - Fostering partnerships between teachers and parents to enhance learning outcomes.

    Leadership Development:
    - Developing leadership skills among school administrators through advanced training programs.

    Inclusive Education:
    - Creating inclusive classrooms to cater to diverse student learning needs and abilities.

    Input 4
    Question: What are the improvements in private schools compared to government schools?
    Output:
    A comparative analysis between private and government schools reveals key differences:

    Key Insights:
    Private Schools:
    - Advancements in personalized learning approaches and integration of advanced technology, such as AI-driven learning tools.
    - A strong focus on international curricula and globally recognized teaching frameworks.

    Government Schools:
    - Prioritization of infrastructure development and updates to the STEM curriculum.
    - Significant progress in fostering student well-being programs and promoting leadership development among educators.

    Input: How did {institute_names} do in terms of {aspect}?
    Output:
    The performance of {institute_names} in terms of {aspect} is as follows:

    Key Strengths:
    Area 1:
    - 
    - 
    - 

    Area 2:
    - 
    - 
    - 

    Key Challenges:
    1. 
    2. 
    3. 
    
?
    '''
    return prompt


def create_analyze_prompt(school, schoolaspect):
    prompt = f"""
        Your goal is to analyze the provided school report and provide insights on the school’s overall performance based on its achievements, challenges, and areas for improvement.

        <instructions>
        1. Ensure that the output contains all the insightful information.
        2. Do not say that you did not find any information.
        </instructions>

        Input 1
        Question: What improvements did Al Bayan School achieve this year?
        Output:
        The performance of Al Bayan School this year highlights several key improvements:

        Key Strengths:
        Curriculum Enhancements:
        - Introduction of a new STEM curriculum to enhance science and technology learning.
        - Implementation of a student mentoring program to support personal development.

        Technological Upgrades:
        - Upgraded classroom technology with smart boards and digital tools.
        - Launched professional development workshops for teachers focused on differentiated instruction.

        Input 2
        Question: What are the key declines observed in Al Bayan School this year?
        Output:
        The performance of Al Bayan School also faced some declines this year:

        Key Challenges:
        Student Engagement:
        - A decrease in extracurricular activity participation due to increased academic pressure.
        - Reduced parent engagement in school activities and decision-making processes.

        Staff Retention and Performance:
        - Higher teacher turnover rates compared to previous years, impacting classroom stability.
        - Challenges in maintaining consistent student performance in mathematics.

        Input 3
        Question: What are the improvements and declines observed at Ibn Khuldoon National School?
        Output:
        The performance of Ibn Khuldoon National School reveals the following insights:

        Key Strengths:
        Student Well-being:
        - Enhanced student well-being through mindfulness and mental health programs.
        - Increased enrollment due to new marketing campaigns and reputation building.

        Curriculum and Infrastructure:
        - Adoption of international curricula like IB, improving global competitiveness.
        - Successful completion of infrastructure renovations, providing better facilities for students.

        Key Challenges:
        Extracurricular Programs:
        - Limited access to advanced extracurricular programs due to budget constraints.
        - Reduced opportunities for international student exchange programs due to logistical issues.

        Staff and Academic Performance:
        - Difficulty retaining senior teaching staff, leading to increased recruitment costs.
        - Reports of inconsistent academic results in science and humanities subjects.

        Input: How did {school} perform in terms of {schoolaspect}?
        Output:
        The performance of {school} in terms of {schoolaspect} is as follows:

        Key Strengths:
        Area 1:
        - 
        - 
        - 

        Area 2:
        - 
        - 
        - 

        Key Challenges:
        1. 
        2. 
        3. 

    """    
    return prompt


def create_uni_analyze_prompt(program_name, standard):
    prompt = f"""
        Your goal is to analyze the provided educational institute report and provide insights on the University overall performance based on the different standards and judgment.

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

        Input: How is the {standard} Standard in {program_name}?          
        Output:
        The {standard} Standard at the {program_name} has been judged as ....
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



def create_compare_uni_prompt(university_names, standard="Quality of Teaching and Learning"):
    prompt = f"""
        Your goal is to analyze the provided educational institute report and provide insights on the University overall performance based on the different standards and judgment.

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

        Input: How is the {standard} Standard in {university_names}?          
        Output:
        The {standard} Standard at the {university_names} has been judged as ....
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
