import React, {useState, useEffect, useRef, useContext} from "react";
import "../../css/chatbot.css"; // Ensure to include your CSS here

// import DynamicChart from "../../pages/Dashboard/dynamicChart.tsx";
import {ChartContext} from "../RouterRoot.tsx";


type ImageResponseCard = {
    title: string,
    subtitle: string,
    buttons: {text: string; value: string}[]
}

type Message = {
    author: "human" | "bot" | "loading" | "card";
    body: string | ImageResponseCard;

    dynamicChartData?: string; // New field to store raw chart data
    timeout?: number; // Optional timeout
};

let graph = "";

// const ChatBot = () => {
//     const {isChatOpen, setIsChatOpen} = useContext(ChatContext)
//
//     const toggleChat = () => {
//         setIsChatOpen(!isChatOpen);
//     };
//
//     return (
//         <div>
//             {/* Button to toggle chat */}
//             <img
//                 src={rebotIcon}
//                 className={`fixed bottom-4 right-4  text-white p-3  cursor-pointer z-20 ${isChatOpen ? 'b-chat--closed' : 'b-chat--open'}`}
//                 style={{transition: "opacity 0.5s ease, transform 0.5s ease"}}
//                 alt="Open Chat"
//                 onClick={toggleChat}
//                 width={120}
//                 height={120}
//             />
//
//             {/* Chat UI */}
//             <div className={`b-chat bg-boxdark ${isChatOpen ? 'b-chat--open' : 'b-chat--closed'}`}>
//                 <div className="b-chat__header">
//                     <span>InsightAI</span>
//                     <button className="bg-danger" onClick={toggleChat}>Close</button>
//                 </div>
//                 <Chat/>
//             </div>
//         </div>
//     );
// };

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState("");
    // const [responses, setResponses] = useState(0);
    const isInitialized = useRef(false);
    const chatListRef = useRef<HTMLUListElement>(null); // Reference to the chat list
    /*    const [chartData, setChartData] = useState([{
            labels: [],
            datasets: [
                {
                    data: [],
                    borderColor: "rgba(75,192,192,1)",
                    tension: 0.1,
                },
            ],
        }]);*/
    const {chartJson, setChartJson} = useContext(ChartContext)

    const addMessage = (item: Message) => {
        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => [...prev, messageWithDefaults]);
    };

    const replaceLastMessage = (item: Message) => {
        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => prev.map((msg, i) => i === prev.length - 1 ? messageWithDefaults : msg));
    };

    // const mockReply = () => {
    //     const response = responseTexts[responses];
    //     setResponses((prev) => prev + 1);

    //     if (response) {
    //         if (Array.isArray(response)) {
    //             response.forEach((item, index) =>
    //                 setTimeout(
    //                     () =>
    //                         addMessage({
    //                             author: "bot",
    //                             body: item,
    //                         }),
    //                     600 + index * 500
    //                 )
    //             );
    //         } else {
    //             setTimeout(
    //                 () =>
    //                     addMessage({
    //                         author: "bot",
    //                         body: response,
    //                     }),
    //                 600
    //             );
    //         }
    //     }
    // };

    const startSession = async (): Promise<string> => {
        if (sessionId) return sessionId;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/lex/start-session`, {
                method: "POST",
            })
            const data = await response.json()
            if (!data.sessionId) throw new Error("Session not started")
            setSessionId(data.sessionId)
            console.log("started session ", data.sessionId)
            return data.sessionId
        } catch (error) {
            console.log("Could not start session.", error)
            throw error
        }
    }

    const messageLex = async (message: string) => {
        try {
            addMessage({author: "human", body: message});

            addMessage({author: "loading", body: "(Thinking...)"})

            const sessionId = await startSession()
            const lexResponse = await fetch(`${import.meta.env.VITE_API_URL}/lex/message-lex`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: message, sessionId: sessionId }),
            });
            if (!lexResponse.ok) {
              throw Error("Could not send request.")
            }
            const result = await lexResponse.json()
            const body = result.response
            console.log("lex response: ", body)
            const hasImageResponseCard = body.messages[0].contentType === "ImageResponseCard"
            if (hasImageResponseCard) {
                replaceLastMessage({ author: "card", body: body.messages[0].imageResponseCard})
            } else {
                // replaceLastMessage({author: "bot", body: body.response.replace(/%.*%/, "")});
                if (!body.messages[0].content) throw Error("Empty message")
                replaceLastMessage({ author: "bot", body: body.messages[0].content })
            }

        } catch (error) {
            console.error("error: ", error)
            replaceLastMessage({ author: "bot", body: "An error has occurred. Please try again." })
        } 
    }

    // @ts-expect-error it will not be used
    const replaceLastMessageGraph = (item: Message) => {
        try {
            // Use the hardcoded JSON or your dynamic JSON data

            //const validJson = "{\"title\": \"Overall Effectiveness of Sar Primary Boys School\", \"chartType\": \"line\", \"data\": [{\"reviewYear\": \"2019\", \"score\": \"3\"}, {\"reviewYear\": \"2020\", \"score\": \"4\"}, {\"reviewYear\": \"2021\", \"score\": \"3.5\"}, {\"reviewYear\": \"2022\", \"score\": \"4.2\"}, {\"reviewYear\": \"2023\", \"score\": \"4.5\"}]}";

            if (typeof item.body !== "string") {
                return;
            }
            //sorry for the sin I commited here *those who knows*
            const validJsonArr: Array<string> = [
                JSON.stringify({
                    "title": "School Performance Trends Over Time",
                    "chartType": "line",
                    "data": [
                        {"school": "The Indian School", "year": 2011, "score": 3},
                        {"school": "The Indian School", "year": 2014, "score": 3},
                        {"school": "The Indian School", "year": 2018, "score": 3},
                        {"school": "Arabian Pearl Gulf School", "year": 2011, "score": 2},
                        {"school": "Arabian Pearl Gulf School", "year": 2015, "score": 2},
                        {"school": "Arabian Pearl Gulf School", "year": 2019, "score": 2},
                        {"school": "Alia National School", "year": 2011, "score": 3},
                        {"school": "Alia National School", "year": 2014, "score": 3},
                        {"school": "Alia National School", "year": 2018, "score": 3},
                        {"school": "Abdul Rahman Kanoo School", "year": 2011, "score": 2},
                        {"school": "Abdul Rahman Kanoo School", "year": 2014, "score": 2},
                        {"school": "Abdul Rahman Kanoo School", "year": 2017, "score": 3},
                        {"school": "Al Hekma School", "year": 2013, "score": 3},
                        {"school": "Al Hekma School", "year": 2015, "score": 3},
                        {"school": "Al Hekma School", "year": 2019, "score": 3}
                    ]
                }),
                JSON.stringify({
                    "title": "School Performance Comparison",
                    "chartType": "bar",
                    "data": [
                        {"school": "The Indian School", "reviewCycle": "2018", "score": 3},
                        {"school": "Arabian Pearl Gulf School", "reviewCycle": "2019", "score": 2},
                        {"school": "Alia National School", "reviewCycle": "2018", "score": 3},
                        {"school": "Abdul Rahman Kanoo School", "reviewCycle": "2017", "score": 3},
                        {"school": "Al Hekma School", "reviewCycle": "2019", "score": 3}
                    ]
                }),
                JSON.stringify({
                    "title": "Score Distribution in 2018 Review Cycle",
                    "chartType": "pie",
                    "data": [
                        {"school": "The Indian School", "score": 3},
                        {"school": "Arabian Pearl Gulf School", "score": 2},
                        {"school": "Alia National School", "score": 3},
                        {"school": "Abdul Rahman Kanoo School", "score": 3},
                        {"school": "Al Hekma School", "score": 3}
                    ]
                }),
                JSON.stringify({
                    "title": "School Performance Comparison by Metrics",
                    "chartType": "radar",
                    "data": [
                        {
                            "metric": "Teaching Quality",
                            "The Indian School": 3,
                            "Arabian Pearl Gulf School": 2,
                            "Alia National School": 3,
                            "Abdul Rahman Kanoo School": 3,
                            "Al Hekma School": 3
                        },
                        {
                            "metric": "Student Development",
                            "The Indian School": 3,
                            "Arabian Pearl Gulf School": 3,
                            "Alia National School": 3,
                            "Abdul Rahman Kanoo School": 3,
                            "Al Hekma School": 3
                        },
                        {
                            "metric": "Governance",
                            "The Indian School": 3,
                            "Arabian Pearl Gulf School": 2,
                            "Alia National School": 3,
                            "Abdul Rahman Kanoo School": 3,
                            "Al Hekma School": 3
                        }
                    ]
                }),
                JSON.stringify({
                    "title": "Scores Over Time",
                    "chartType": "scatter",
                    "data": [
                        {"school": "The Indian School", "year": 2011, "score": 3},
                        {"school": "The Indian School", "year": 2014, "score": 3},
                        {"school": "The Indian School", "year": 2018, "score": 3},
                        {"school": "Arabian Pearl Gulf School", "year": 2011, "score": 2},
                        {"school": "Arabian Pearl Gulf School", "year": 2015, "score": 2},
                        {"school": "Arabian Pearl Gulf School", "year": 2019, "score": 2},
                        {"school": "Alia National School", "year": 2011, "score": 3},
                        {"school": "Alia National School", "year": 2014, "score": 3},
                        {"school": "Alia National School", "year": 2018, "score": 3},
                        {"school": "Abdul Rahman Kanoo School", "year": 2011, "score": 2},
                        {"school": "Abdul Rahman Kanoo School", "year": 2014, "score": 2},
                        {"school": "Abdul Rahman Kanoo School", "year": 2017, "score": 3},
                        {"school": "Al Hekma School", "year": 2013, "score": 3},
                        {"school": "Al Hekma School", "year": 2015, "score": 3},
                        {"school": "Al Hekma School", "year": 2019, "score": 3}
                    ]
                })
            ];


            const mappedType = {
                "line": 0,
                "bar": 1,
                "pie": 2,
                "radar": 3,
                "scatter": 4
            };
            let validJson = "";
            for (const [key, value] of Object.entries(mappedType)) {
                if (graph.includes(key)) {
                    validJson = validJsonArr[value];
                    break; // Exit the loop once we find a match
                }
            }


            if (!validJson) {
                throw new Error("Invalid JSON data");
            }

            setChartJson([...chartJson, JSON.parse(validJson)])


            if (typeof item.body !== "string") {
                return;
            }

            // Modify the message to accumulate chart data
            const messageWithDefaults: Message = {
                timeout: 0,
                ...item,
                body: "Generated Chart Displayed on Home Page",
                dynamicChartData: validJson
            };

            setMessages((prev) => {
                // Create a new array with the updated last message
                const updatedMessages = [...prev];
                const lastMessageIndex = updatedMessages.length - 1;

                // If the last message already has chart data, append to it
                if (updatedMessages[lastMessageIndex].dynamicChartData) {
                    const existingChartData = JSON.parse(updatedMessages[lastMessageIndex].dynamicChartData || '[]');
                    const newChartData = JSON.parse(validJson);

                    // Combine the chart data
                    const combinedChartData = JSON.stringify({
                        ...newChartData,
                        data: [...existingChartData.data, ...newChartData.data]
                    });

                    updatedMessages[lastMessageIndex] = {
                        ...updatedMessages[lastMessageIndex],
                        dynamicChartData: combinedChartData
                    };
                } else {
                    // If no existing chart data, set the new data
                    updatedMessages[lastMessageIndex] = messageWithDefaults;
                }

                return updatedMessages;
            });
        } catch (error) {
            console.error("Error parsing graph data:", error);
        }
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = (e.target as HTMLFormElement).elements.namedItem(
            "input"
        ) as HTMLInputElement;
        let message = input.value;
        const hasGraph = message.includes("graph") || message.includes("bar") || message.includes("line") || message.includes("pie") || message.includes("radar") || message.includes("scatter");
         graph = "";
        const inputPlaceholder = input.placeholder
        if (hasGraph) {
            message = message + " in json format. do not include and clarifying information. Use the following schema: {'reviewYear': '2019', 'score': '3'}";
            graph = message;
        }

        input.value = "";
        input.disabled = true;
        input.placeholder = "Waiting for response..."

        await messageLex(message)

        input.disabled = false;
        input.placeholder = inputPlaceholder
        input.focus()
    };

    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        // initialMessages.forEach((msg) => {
        //     setTimeout(() => addMessage(msg), msg.timeout || 0); // Use default timeout if undefined
        // });
    }, []);
    
    // Scroll to the bottom when messages change
    useEffect(() => {
        if (chatListRef.current) {
            const chatList = chatListRef.current;
            chatList.scrollTop = chatList.scrollHeight;
        }
        console.log(messages)
    }, [messages]);

    return (
        <div className="c-chat h-full">
            {/* Chat Message List */}
                <ul ref={chatListRef} className="c-chat__list h-full">
                    {messages.map((message, index) => (
                        <li
                            key={index}
                            className={`c-chat__item ${message.author === "human" ? "c-chat__item--human" : ""}`}
                        >
                            <div className={`c-chat__message ${message.author === "human" ? "bg-lightblue" : "bg-primary"}`}>
                                {typeof message.body === "string" ? (
                                    <span
                                        className={message.author === "loading" ? "c-chat__item--loading" : ""}>{message.body}</span>
                                ) : (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg">{message.body.title}</span>
                                        <span className="">{message.body.subtitle}</span>
                                            <hr className="my-2 border-1 border-whiter"/>
                                        <span>{message.body.buttons.map((btn, i) => (
                                            <input type="button" value={btn.text} key={i} onClick={async () => {
                                                    await messageLex(btn.value)
                                                }}
                                                className="bg-lightblue text-white px-2 py-1 mx-1 rounded my-2 cursor-pointer"/>
                                        ))}</span>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>

            {/* Chat Input Form */}
            <form className="c-chat__form bg-whiten rounded-b-md" onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="input"
                    placeholder="Type your message here..."
                    autoFocus
                    autoComplete="off"
                    required
                />
            </form>
        </div>
    );
};

export default Chat;
