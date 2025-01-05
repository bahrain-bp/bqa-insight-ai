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


def create_school_analyze_prompt(school, schoolaspect):
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


def create_uni_analyze_prompt(standard, university_name, program_name=""):
    prompt = f"""
        Your goal is to analyze the provided educational institute report and provide insights on the University overall performance based on the different standards and judgment.

        <instructions>
        1. Ensure that the output contains all the insightful information.
        2. Do not use the below input output examples as an answer.
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

        Input: How is the {standard} Standard in {program_name} in {university_name}?          
        Output:
        The {standard} Standard at the {program_name} in {university_name} has been judged as ....
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


def create_program_uni_analyze_prompt(standard, programme_name, institute_name):
    prompt = f"""
        Your goal is to analyze the provided Programmes-within-College review report overall performance based on the different standards or indicators and judgment as well as the overview of the Bachelor Degree.

        <instructions>
        1. Ensure that the output contains all the insightful information.
        2. Do not use the below input output examples in your response to a different question.
        </instructions>

        Input 1
        Question: How is the Efficiency of the Programme Standard or indicator in the College of Information Technology offered by Ahlia University?
        Output: The efficiency of the Bachelor of Information Technology programme in the College of Information Technology at Ahlia University has been evaluated as meeting the standards required by the Directorate of Higher Education Reviews (DHR) of the National Authority for Qualifications & Quality Assurance of Education & Training (QQA). Key findings include:

        1. Admissions and Support:
        - The programme has clear but liberal admission policies, though recommendations were made to set explicit and publicized minimum scores for entry.
        - Students with special needs are considered and supported effectively.

        2. Staffing and Resources:
        - The faculty includes qualified academic staff with PhDs or master’s degrees in relevant fields.
        - The programme has adequate IT resources, laboratories, and digital infrastructure to support learning.

        3. Management:
        - Clear lines of accountability exist within the management structure of the programme.
        - A robust advising system and academic tracking (via the ADREG system) are in place to support students.

        4. Areas for Improvement:
        - Ensuring that academic staff have sufficient time for research.
        - Addressing issues like photocopying of textbooks by students to comply with copyright laws.
        - Enhancing facilities such as library space for the growing student population.

        The overall conclusion is that the programme satisfies the indicator for efficiency, demonstrating appropriate use of resources, infrastructure, and student support systems.

        Input 2
        Question: How is The Learning Programme Standard or indicator in the Bachelor of Information and Communications Technology offered by Bahrain Polytechnic?
        Output: The **Learning Programme Standard** in the Bachelor of Information and Communications Technology (BICT) offered by Bahrain Polytechnic has been evaluated and satisfies the requirements. Key findings include:

        1. Curriculum Design:
        - The curriculum is well-organized to provide academic progression and balance between theoretical knowledge and practical skills. 
        - The programme comprises 480 credits completed over four years and includes specializations such as programming, networking, information systems, and database systems.
        - The curriculum has been benchmarked with international standards and incorporates Problem and Project-Based Learning (PBL), aligning with institutional goals and industry needs.

        2. Teaching and Learning:
        - Diverse teaching methods are utilized, including lectures, tutorials, group projects, and laboratory work.
        - The use of Moodle as a Learning Management System and the focus on PBL enhances student engagement and supports lifelong learning.
        - E-learning is integrated, but the institution is recommended to expedite the implementation of a formal e-learning framework.

        3. Assessment:
        - A range of assessment methods, such as examinations, reports, and quizzes, are aligned with course and programme learning outcomes.
        - Internal and external moderation processes ensure the validity and fairness of assessments, though improvements in measuring overall programme learning outcomes are recommended.

        4. Graduate Attributes:
        - Graduate attributes and learning outcomes are generally well-defined and appropriate but need refinement to ensure clarity and measurability.
        - The institution is advised to involve stakeholders more consistently in revising programme aims.

        Areas for Improvement:
        - Revise Programme Intended Learning Outcomes (PILOs) to ensure they are measurable and appropriate.
        - Accelerate the approval and implementation of the proposed e-learning framework.
        - Enhance stakeholder engagement in curriculum development.

        The review concludes that the Learning Programme Standard for the BICT is satisfied, demonstrating fitness for purpose in terms of curriculum, teaching, and assessment.

        Input: How is the {standard} Standard or indicator in the Bachelor of {programme_name} offered by {institute_name}?          
        Output:
        The {standard} Standard in the Bachelor of {programme_name} offered by {institute_name} has been evaluated as meeting the requirements. Key findings include:

        1. Title 1:
        -
        -
        2. Title 2:
        - 
        -

        3. Title 3:
        - 
        - 

        4. Title 4:
        - 
        - 
        -

        Conclusion:
    """
    return prompt


def create_compare_programme(standard, programme_name, institutes):
    prompt = f"""
              Your goal is to compare between the provided Programmes-within-College review reports and provide insights on the programmes'overall performance based on the different standards or indicators and judgment as well as the overview of the Bachelor Degree.
             

              <instructions>
                1. Ensure that the output contains all the insightfull information.
                2. Do not use the bellow Input Output in your response to different questions.
		        3. Input may contain multiple programmes either seperated by ',' or by 'and', Do not combine these names to as one programme.  
		        4. You can add more Titles to the output and make the format look readable.             
              </instructions>

        Input 1
        Question: Compare between The Learning Programme Standard in the Bachelor of Information and Communications Technology programme offered by Bahrain Polytechnic and Ahlia University.
        Output:
        1. Curriculum Design
        Bahrain Polytechnic (BP):

        The curriculum is structured into 480 credits over four years, offering four specializations: Programming, Networking, Information Systems, and Database Systems.
        Emphasizes Problem and Project-Based Learning (PBL) to foster practical, industry-aligned skills.
        Includes co-operative learning projects for real-world exposure, though not mandatory.
        Ahlia University (AU):

        The Bachelor in Information Technology (BIT) comprises 132 credits across 44 courses, integrating theory and practical applications.
        Features professional certification-aligned courses (e.g., Microsoft certifications) and emphasizes practical projects.
        Offers an optional internship program requiring a minimum of 180 hours, enhancing employability.
        2. Teaching and Learning Approaches
        Bahrain Polytechnic:

        Employs diverse teaching strategies, including group projects, lab work, and independent studies.
        Integrates Moodle for e-learning, supported by an emerging e-learning framework.
        Focuses on PBL to bridge the gap between academia and industry.
        Ahlia University:

        Utilizes a mix of lectures, practical sessions, and case studies, supported by Moodle for e-learning.
        Encourages student engagement through well-structured teaching materials and interactive sessions.
        3. Assessment and Learning Outcomes
        Bahrain Polytechnic:

        Employs various assessment methods, including quizzes, exams, and projects, with a focus on both formative and summative assessments.
        Internal and external moderation ensure the rigor of assessments.
        Ahlia University:

        Provides a comprehensive Student Assessment Manual and guidelines for projects and internships.
        Aligns course assessments with Intended Learning Outcomes (ILOs), though greater transparency in alignment is recommended.
        4. Graduate Attributes
        Bahrain Polytechnic:

        Graduate attributes include adaptability, teamwork, and 21st-century skills, which are mapped to Program Intended Learning Outcomes (PILOs).
        Ahlia University:

        Encourages generic graduate attributes such as critical thinking and technical proficiency.
        Recommendations suggest deriving more specific attributes tailored to IT disciplines.
        Recommendations for Improvement
        Bahrain Polytechnic:

        Expedite the implementation of the formal e-learning framework.
        Revise PILOs to ensure clarity, measurability, and alignment with course-level outcomes.
        Ahlia University:

        Increase the availability of internship placements and refine internship evaluation criteria.
        Strengthen alignment between course assessments and ILOs.




        Conclusion

        Both programs exhibit strengths in aligning their curricula with industry needs and incorporating innovative teaching methods. Bahrain Polytechnic excels in implementing PBL and fostering industry ties, while Ahlia University emphasizes practical projects and professional certifications. Both institutions could benefit from enhanced alignment of assessments with learning outcomes and greater stakeholder involvement in program development.


        Input 2:
        Question: Compare between The Academic Standards of Students and Graduates in the Bachelor in Accounting and Finance programme offered by Bahrain Institute of Banking and Finance and Gulf University.
        Output:Introduction:
        The academic standards of students and graduates in the Bachelor of Accounting and Finance (BAAF) programme offered by Bahrain Institute of Banking and Finance (BIBF) and Gulf University (GU) are shaped by unique approaches to assessment, supervision, and alignment with learning outcomes. This comparison highlights the key similarities and differences in the academic processes, mechanisms, and outcomes of the two institutions.

        1. Assessment and Alignment with Learning Outcomes

        BIBF: Follows BU Assessment Framework, ensuring alignment with CILOs and PILOs; uses theoretical and practical assessments balanced across levels.
        GU: Emphasizes milestone-based assessments (e.g., graduation projects) mapped to PILOs; utilizes external panels to enhance alignment with outcomes.
        2. Moderation Processes

        BIBF: Internal moderation includes pre-assessment verification, post-assessment reviews, and double marking; external examiners provide feedback on assessments.
        GU: Internal assessments by supervisors and faculty, supported by external panel evaluations; focus on qualitative and quantitative feedback for continuous improvement.
        3. Graduation Projects and Capstone Components

        BIBF: No formal capstone project; incorporates project-based assessments and case studies throughout the curriculum.
        GU: Graduation project with structured supervision, progression tracking, and evaluation by supervisors, internal panels, and external experts.
        4. Academic Integrity Mechanisms

        BIBF: Policies include Turnitin for plagiarism detection, formal procedures for handling misconduct, and QA monitoring of academic integrity.
        GU: Graduation project progression form tracks student contributions, reducing risks of academic dishonesty; integrates broader academic integrity policies.
        5. Graduate Achievements and Employability

        BIBF: Graduate employability rate ranges from 85% to 92%; external moderation ensures alignment with industry needs.
        GU: Progression and graduation rates average between 80% and 90%; graduate achievements linked to structured project evaluations and alumni feedback.
        6. Resources and Faculty Support

        BIBF: Academic support integrated into weekly teaching loads; assessments overseen by Bangor University to ensure faculty alignment with standards.
        GU: Up to three hours per week allocated specifically for supervising graduation projects, ensuring adequate faculty-student interaction.
        7. Feedback and Continuous Improvement

        BIBF: Uses Graduate Exit and Alumni Surveys to collect data; external examiners contribute to programme refinement.
        GU: Feedback collected from students, supervisors, and external panels; evidence of formal improvements based on feedback in graduation projects.
        8. Benchmarking

        BIBF: Benchmarking agreements with other institutions do not include detailed progression and attrition comparisons.
        GU: Suggested by reviewers to expand benchmarking agreements to include progression, retention, and attrition rates.
        Conclusion:
        Both BIBF and GU maintain robust academic standards, but their approaches reflect differences in focus and implementation. BIBF integrates external oversight through Bangor University, ensuring alignment with global standards, while GU emphasizes comprehensive supervision and milestone tracking, particularly in its graduation projects. Both institutions could benefit from enhanced benchmarking and a focus on incorporating more qualitative assessments to complement existing mechanisms, ensuring continuous improvement and graduate success.


        Input: Compare between {standard} Standard in the Bachelor of {programme_name} programme offered by {institutes}?          
        Output:
        Introducion:

        1. Title 1

        University1 Name:



        University2 Name:

        2. Title 2:
        University1 Name:


        University2 Name:


        3. Title 3:
        University1 Name:


        University2 Name:


        Recommendations for Improvement:
        University1 Name:

        University2 Name:

        Conclusion:

"""
    return prompt


def create_analyze_vocational_training_centre(instituite_name, aspect):
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

    Input: How did {instituite_name} do in terms of {aspect}?
    Output:
    The performance of {instituite_name} in terms of {aspect} is as follows:

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
    
'''
    
    return prompt


def create_compare_vocational_training_centres(instituites, aspect):
    prompt = f"""
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

    Input: How did {instituites} do in terms of {aspect}?
    Output:
    The performance of {instituites} in terms of {aspect} is as follows:

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