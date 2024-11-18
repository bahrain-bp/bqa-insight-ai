import React, {useState, useEffect, useRef} from "react";
import "../../css/chatbot.css"; // Ensure to include your CSS here
import rebotIcon from "../../images/rebot.svg";

type Message = {
    author: "human" | "bot" | "loading";
    body: string | { url: string; text: string }[];
    timeout?: number; // Optional timeout
};

const ChatBot = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <div>
            {/* Button to toggle chat */}
            {!isChatOpen && (
                <img
                    src={rebotIcon}
                    className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg cursor-pointer"
                    alt="Open Chat"
                    onClick={toggleChat}
                />
            )}

            {/* Chat UI */}
            {isChatOpen && (
                <div className="b-chat">
                    <div className="b-chat__header">
                        <span>ChatBot</span>
                        <button onClick={toggleChat}>Close</button>
                    </div>
                    <div id="chat">
                        <Chat/>
                    </div>
                </div>
            )}
        </div>
    );
};

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [responses, setResponses] = useState(0);
    const isInitialized = useRef(false);

    const initialMessages: Message[] = [
        {author: "loading", body: "...", timeout: 0},
        {author: "bot", body: "Hello", timeout: 800},
        {author: "bot", body: "Follow the white rabbit...", timeout: 1500},
        {author: "bot", body: "Ach I'm kidding, it's me, Paul", timeout: 3000},
        {author: "bot", body: "What's up?", timeout: 4000},
        {
            author: "bot",
            body: [
                {url: "/blog/", text: "Blog"},
                {url: "https://codepen.io/onefastsnail", text: "Codepen"},
                {url: "https://github.com/onefastsnail", text: "Github"},
            ],
            timeout: 5000,
        },
    ];

    const responseTexts = [
        "This bot silly",
        "No really, it's a gimmick, quickly made in my Codepen",
        [
            "Ok here is a joke...",
            "When Alexander Graham Bell invented the telephone he had three missed calls from Chuck Norris",
        ],
        [
            "Want another? Ok last one...",
            "Chuck Norris can win a game of Connect 4 with 3 moves",
        ],
        "I'm out, goodbye.",
    ];

    const addMessage = (item: Message) => {
        const messageWithDefaults = {timeout: 0, ...item}; // Ensure default timeout is applied
        setMessages((prev) => [...prev, messageWithDefaults]);
    };

    const mockReply = () => {
        const response = responseTexts[responses];
        setResponses((prev) => prev + 1);

        if (response) {
            if (Array.isArray(response)) {
                response.forEach((item, index) =>
                    setTimeout(
                        () =>
                            addMessage({
                                author: "bot",
                                body: item,
                            }),
                        600 + index * 500
                    )
                );
            } else {
                setTimeout(
                    () =>
                        addMessage({
                            author: "bot",
                            body: response,
                        }),
                    600
                );
            }
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = (e.target as HTMLFormElement).elements.namedItem(
            "input"
        ) as HTMLInputElement;
        addMessage({author: "human", body: input.value});
        mockReply();
        input.value = "";
    };

    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        initialMessages.forEach((msg) => {
            setTimeout(() => addMessage(msg), msg.timeout || 0); // Use default timeout if undefined
        });
    }, []);

    return (
        <div className="c-chat">
            {/* Chat Message List */}
            <ul className="c-chat__list">
                {messages.map((message, index) => (
                    <li
                        key={index}
                        className={`c-chat__item ${
                            message.author === "human" ? "c-chat__item--human" : ""
                        }`}
                    >
                        <div className="c-chat__message">
                            {typeof message.body === "string" ? (
                                message.body
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
