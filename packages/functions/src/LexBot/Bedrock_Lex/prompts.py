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