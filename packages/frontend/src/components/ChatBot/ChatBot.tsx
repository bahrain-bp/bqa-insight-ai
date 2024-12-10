import React, {useState, useEffect, useRef, useContext} from "react";
import "../../css/chatbot.css"; // Ensure to include your CSS here
import rebotIcon from "../../images/rebot.svg";
import {ChatContext} from "../../layout/DefaultLayout";

import DynamicChart from "../../pages/Dashboard/dynamicChart.tsx";
//import {ChartContext} from "../RouterRoot.tsx";


type Message = {
    author: "human" | "bot" | "loading";
    body: string | { url: string; text: string }[];

    dynamicChartData?: string; // New field to store raw chart data
    timeout?: number; // Optional timeout
};

const ChatBot = () => {
    const {isChatOpen, setIsChatOpen} = useContext(ChatContext)

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <div>
            {/* Button to toggle chat */}
            <img
                src={rebotIcon}
                className={`fixed bottom-4 right-4  text-white p-3  cursor-pointer z-20 ${isChatOpen ? 'b-chat--closed' : 'b-chat--open'}`}
                style={{transition: "opacity 0.5s ease, transform 0.5s ease"}}
                alt="Open Chat"
                onClick={toggleChat}
                width={120}
                height={120}
            />

            {/* Chat UI */}
            <div className={`b-chat ${isChatOpen ? 'b-chat--open' : 'b-chat--closed'}`}>
                <div className="b-chat__header">
                    <span>ChatBot</span>
                    <button onClick={toggleChat}>Close</button>
                </div>
                <Chat/>
            </div>
        </div>
    );
};

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    // const [responses, setResponses] = useState(0);
    const isInitialized = useRef(false);
    const chatListRef = useRef<HTMLUListElement>(null); // Reference to the chat list
    // const [chartData, setChartData] = useState([{
    //     labels: [],
    //     datasets: [
    //         {
    //             data: [],
    //             borderColor: "rgba(75,192,192,1)",
    //             tension: 0.1,
    //         },
    //     ],
    // }]);
    //const {chartJson, setChartJson} = useContext(ChartContext)

    const addMessage = (item: Message) => {
        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => [...prev, messageWithDefaults]);
    };

    const replaceLastMessage = (item: Message) => {
        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => prev.map((msg, i) => i === prev.length - 1 ? messageWithDefaults : msg));
    };
    const replaceLastMessageGraph = (item: Message) => {
        try {
            // Use the hardcoded JSON or your dynamic JSON data

            //const validJson = "{\"title\": \"Overall Effectiveness of Sar Primary Boys School\", \"chartType\": \"line\", \"data\": [{\"reviewYear\": \"2019\", \"score\": \"3\"}, {\"reviewYear\": \"2020\", \"score\": \"4\"}, {\"reviewYear\": \"2021\", \"score\": \"3.5\"}, {\"reviewYear\": \"2022\", \"score\": \"4.2\"}, {\"reviewYear\": \"2023\", \"score\": \"4.5\"}]}";
            //setChartJson([...chartJson, JSON.parse(validJson)])

            debugger;

            if (typeof item.body !== "string") {
                return;
            }

            const validJson = JSON.parse(item.body);
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
        var message = input.value;
        addMessage({author: "human", body: message});
        var hasGraph = true;//message.includes("graph");

        const inputPlaceholder = input.placeholder
        if (hasGraph) {
            message = message + " in json format. do not include and clarifying information. Use the following schema: {'reviewYear': '2019', 'score': '3'}";
        }
        try {

            input.value = "";
            input.disabled = true;
            input.placeholder = "Waiting for response..."

            addMessage({author: "loading", body: "(Thinking...)"})

            const bedrockResponse = await fetch(`${import.meta.env.VITE_API_URL}/langChain`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({userMessage: message}),
            });
            const body = await bedrockResponse.json()
            // replaceLastMessage({author: "bot", body: body.response.replace(/%.*%/, "")});
            if (hasGraph) {
                replaceLastMessageGraph({author: "bot", body: body.response})
            } else {
                replaceLastMessage({author: "bot", body: body.response})

            }


        } catch (error) {
            console.error(error)
            replaceLastMessage({author: "bot", body: "An error has occurred. Please try again."})
        } finally {
            input.disabled = false;
            input.placeholder = inputPlaceholder
            input.focus()
        }
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
    }, [messages]);

    return (
        <div className="c-chat">
            {/* Chat Message List */}
            <ul ref={chatListRef} className="c-chat__list">
                {messages.map((message, index) => (
                    <li
                        key={index}
                        className={`c-chat__item ${message.author === "human" ? "c-chat__item--human" : ""
                        }`}
                    >
                        <div className={`c-chat__message`}>
                            {typeof message.body === "string" ? (
                                <span
                                    className={message.author === "loading" ? "c-chat__item--loading" : ""}>{message.body}</span>
                            ) : (
                                message.body.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        className="c-chat__action"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {link.text}
                                    </a>
                                ))
                            )}

                            {/* Render Dynamic Chart if dynamicChartData exists */}
                            {message.dynamicChartData && (
                                <div className="mt-2">
                                    {(() => {
                                        try {
                                            const parsedData = JSON.parse(message.dynamicChartData);
                                            return <DynamicChart jsonData={parsedData}/>;
                                        } catch (error) {
                                            console.error('Error parsing chart data:', error);
                                            return null;
                                        }
                                    })()}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {/* Chat Input Form */}
            <form className="c-chat__form" onSubmit={handleSubmit}>
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

export default ChatBot;
