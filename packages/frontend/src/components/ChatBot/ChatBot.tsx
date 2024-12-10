import React, {useState, useEffect, useRef, useContext} from "react";
import "../../css/chatbot.css"; // Ensure to include your CSS here
import rebotIcon from "../../images/rebot.svg";
import {ChatContext} from "../../layout/DefaultLayout";
import {Line} from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

type Message = {
    author: "human" | "bot" | "loading";
    body: string | { url: string; text: string }[];
    chartData?: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            tension: number;
        }[];
    };
    //TODO: maybe u will need to check chart type if there is no general chart type
    chartType?: "line" | "bar"; // Optional chart type
    timeout?: number; // Optional timeout
};

const ChatBot = () => {
    const {isChatOpen, setIsChatOpen} = useContext(ChatContext);

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

    // const initialMessages: Message[] = [
    //     {author: "loading", body: "...", timeout: 0},
    //     {author: "bot", body: "Hello", timeout: 800},
    //     {author: "bot", body: "Follow the white rabbit...", timeout: 1500},
    //     {author: "bot", body: "Ach I'm kidding, it's me, Paul", timeout: 3000},
    //     {author: "bot", body: "What's up?", timeout: 4000},
    //     {
    //         author: "bot",
    //         body: [
    //             {url: "/blog/", text: "Blog"},
    //             {url: "https://codepen.io/onefastsnail", text: "Codepen"},
    //             {url: "https://github.com/onefastsnail", text: "Github"},
    //         ],
    //         timeout: 5000,
    //     },
    // ];

    // const responseTexts = [
    //     "This bot silly",
    //     "No really, it's a gimmick, quickly made in my Codepen",
    //     [
    //         "Ok here is a joke...",
    //         "When Alexander Graham Bell invented the telephone he had three missed calls from Chuck Norris",
    //     ],
    //     [
    //         "Want another? Ok last one...",
    //         "Chuck Norris can win a game of Connect 4 with 3 moves",
    //     ],
    //     "I'm out, goodbye.",
    // ];

    const addMessage = (item: Message) => {
        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => [...prev, messageWithDefaults]);
    };

    const replaceLastMessage = (item: Message) => {
        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => prev.map((msg, i) => i === prev.length - 1 ? messageWithDefaults : msg));
    };
    const replaceLastMessageGraph = (item: Message) => {
        let dataBody = item.body;
        item.body = "";

        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => prev.map((msg, i) => i === prev.length - 1 ? messageWithDefaults : msg));

        // Check if the body contains a graph message (in JSON format)
        try {
            debugger
            let validJson = "";
            if (typeof dataBody === "string") {
                validJson = dataBody.replace(/'/g, '"');
            }

            const data = JSON.parse(validJson); // Parse the JSON string to an object/array

            // Extract labels (reviewYears) and data (scores) from the parsed data
            //todo: change the keys to match the keys in the json dynamic
            const labels = data.map((item: { reviewYear: string }) => item.reviewYear);
            const scores = data.map((item: { score: string }) => parseInt(item.score));

            // Create the message with both body text and chart data
            const messageWithDefaults = {
                timeout: 0,
                ...item,
                chartData: {
                    labels,
                    datasets: [
                        {
                            label: "Review Scores",
                            data: scores,
                            borderColor: "rgba(75,192,192,1)",
                            tension: 0.1,
                        },
                    ],
                }
            };

            setMessages((prev) => prev.map((msg, i) => i === prev.length - 1 ? messageWithDefaults : msg));

        } catch (error) {
            console.error("Error parsing graph data:", error);
        }

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = (e.target as HTMLFormElement).elements.namedItem(
            "input"
        ) as HTMLInputElement;
        var message = input.value;
        addMessage({author: "human", body: message});
        var hasGraph = message.includes("graph");

        const inputPlaceholder = input.placeholder
        if (hasGraph) {
            message = message + " in json format. do not include and clarifying information. Use the following schema: {'reviewYear': '2019', 'score': '3'}";
        }
        try {

            input.value = "";
            input.disabled = true;
            input.placeholder = "Waiting for response..."

            addMessage({author: "loading", body: "(Thinking...)"})

            const bedrockResponse = await fetch(`${import.meta.env.VITE_API_URL}/invokeBedrock`, {
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
                        className={`c-chat__item ${
                            message.author === "human" ? "c-chat__item--human" : ""
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

                            {/* Render chart if chartData exists */}
                            {message.chartData && (
                                <div className="mt-2">
                                    <Line
                                        data={message.chartData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    display: true,
                                                },
                                                title: {
                                                    display: true,
                                                    text: 'Review Scores Over Years'
                                                }
                                            }
                                        }}
                                    />
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
