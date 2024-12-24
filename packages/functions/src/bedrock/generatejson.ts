import OpenAI from "openai";


export const generateJson = async (event: string) => {

  const command = `{

        Your goal is to analyze the given text and provide a relavant title in relation to 
        the given text in JSON format, then extract data from the given text appropriate to be used for chart generation, 
        the chart data you provide must include unified column names and corresponding values extracted from the analysis, 
        meaning unified points, in JSON format, after that provide a chart type whether it be line chart, 
        bar graph, scatter line chart, or pie chart that is the optimum choice to display the chart data you generated after 
        analyzing the given text in JSON format. Please follow the format given exactly, but number of rows could be higher or 
        lower depending on the relevant chart data in JSON format, and columns must have relevant titles. If there is a range of 
        data, like "...grades 9-10", please type it as individual rows, like "grade: 9, grade: 10".

             <instructions>
                1. Do not add any calrifying information.
                2. Use the specified schema.
             </instructions>
            <formatting>
            {

                        "type": "line",
                        "data": {
                            "datasets": [
                            {
                                "label": "Jidhafs Intermediate Boys School",
                                "data": [
                                {"x": 2010, "y": 2},
                                {"x": 2012, "y": 2},
                                {"x": 2016, "y": 2},
                                {"x": 2018, "y": 3},
                                {"x": 2024, "y": 3}
                                ],
                                "borderColor": "#111177",
                                "fill": false
                            },
                            {
                                "label": "Al Sehlah Intermediate Boys School",
                                "data": [
                                {"x": 2011, "y": 3},
                                {"x": 2014, "y": 3},
                                {"x": 2016, "y": 4},
                                {"x": 2019, "y": 3},
                                {"x": 2023, "y": 2}
                                ],
                                "borderColor": "#771111",
                                "fill": false
                            },
                            {
                                "label": "Hamad Town Intermediate Boys School",
                                "data": [
                                {"x": 2013, "y": 4},
                                {"x": 2018, "y": 3},
                                {"x": 2021, "y": 3},
                                {"x": 2024, "y": 4}
                                ],
                                "borderColor": "#117711",
                                "fill": false
                            }
                            ]
                        },
                        "options": {
                            "scales": {
                            "x": {
                                "type": "linear"
                            },
                            "y": {
                                "type": "linear",
                                "min": 1,
                                "max": 4,
                                "reverse": true,
                                "ticks": {
                                "stepSize": 1
                                }
                            }
                            }
                        }
                        }
                        ——————————————————————————————————————————————————————————————
                        {
                        "type": "bar",
                        "data": {
                            "datasets": [
                            {
                                "label": "Primary Schools",
                                "data": [
                                {"x": "Al Andalus", "y": 4},
                                {"x": "Al Noor", "y": 4},
                                {"x": "Al Wafa", "y": 3},
                                {"x": "Al Hedaya", "y": 2},
                                {"x": "Al Nahda", "y": 3}
                                ],
                                "backgroundColor": "#111177",
                                "borderColor": "#111177"
                            }
                            ]
                        },
                        "options": {
                            "scales": {
                            "y": {
                                "type": "linear",
                                "min": 1,
                                "max": 4,
                                "ticks": {
                                "stepSize": 1
                                }
                            }
                            }
                        }
                        }
                        ——————————————————————————————————————————————————————————————
                        {
                        "type": "scatter",
                        "data": {
                            "datasets": [
                            {
                                "label": "Primary Schools",
                                "data": [
                                {"x": 250, "y": 2},
                                {"x": 420, "y": 3},
                                {"x": 380, "y": 3},
                                {"x": 520, "y": 4},
                                {"x": 320, "y": 2}
                                ],
                                "backgroundColor": "#111177",
                                "borderColor": "#111177"
                            },
                            {
                                "label": "Secondary Schools",
                                "data": [
                                {"x": 450, "y": 3},
                                {"x": 580, "y": 4},
                                {"x": 620, "y": 3},
                                {"x": 480, "y": 2},
                                {"x": 550, "y": 3}
                                ],
                                "backgroundColor": "#771111",
                                "borderColor": "#771111"
                            }
                            ]
                        }
                        }
                        ——————————————————————————————————————————————————————————————
                        {
                        "type": "pie",
                        "data": {
                            "labels": ["Grade 1", "Grade 2", "Grade 3"],
                            "datasets": [
                            {
                                "data": [4, 3, 3],
                                "backgroundColor": [
                                "#111177",
                                "#771111",
                                "#117711"
                                ]
                            }
                            ]
                        },
                        "options": {
                            "responsive": true,
                            "plugins": {
                            "legend": {
                                "position": "top"
                            }
                            }
                        }
                        }
                            }
                    </formatting>
                    Given text: ${event}
                    `;






  try {
    //¬let completion = "";

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      store: false,
      messages: [
        { "role": "user", "content": command }
      ]
    })
    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error("responseText is undefined");
    }

    console.log(responseText)

    // Extract and parse JSON 
    const jsonMatch = responseText.match(/{.*}/s);
    // Extract JSON object 
    if (!jsonMatch) { throw new Error("No JSON object found in the response"); }
    try {
      // Parse the matched JSON 
      const parsedJson = JSON.parse(jsonMatch[0]);
      return { statusCode: 200, body: parsedJson };
    } catch (parseError) { console.error("Error parsing JSON:", parseError); throw new Error("Failed to parse JSON from response"); }
  } catch (err) {
    console.error("Error invoking Bedrock agent generate json:", err);
    return undefined;
  }
};


