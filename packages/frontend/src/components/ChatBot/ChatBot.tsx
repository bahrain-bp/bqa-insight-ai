import React, {useState, useEffect, useRef, useContext} from "react";
import "../../css/chatbot.css"; // Ensure to include your CSS here
import rebotIcon from "../../images/rebot.svg";
import { ChatContext } from "../../layout/DefaultLayout";
import LexAWS from "./LexAWS.tsx";

type Message = {
    author: "human" | "bot" | "loading";
    body: string | { url: string; text: string }[];
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
                    className={`fixed bottom-4 right-4  text-white p-3  cursor-pointer z-20 ${isChatOpen ? 'b-chat--closed' : 'b-chat--open' }`}
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
                        {/* <Chat/> */}
                        <LexAWS />
                </div>
        </div>
    );
};

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState("");
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
    const  handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = (e.target as HTMLFormElement).elements.namedItem(
            "input"
        ) as HTMLInputElement;
        const message = input.value;
        addMessage({author: "human", body: message});

        const inputPlaceholder = input.placeholder

        try {

            input.value = "";
            input.disabled = true;
            input.placeholder = "Waiting for response..."

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
            const body = await lexResponse.json()
            console.log("lex response: ", body)
            // replaceLastMessage({author: "bot", body: body.response.replace(/%.*%/, "")});
            replaceLastMessage({author: "bot", body: body.response})

        } catch (error) {
            console.error("error: ", error)
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
        console.log(messages)
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
                                <span className={message.author === "loading" ? "c-chat__item--loading" : ""}>{ message.body }</span>
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
