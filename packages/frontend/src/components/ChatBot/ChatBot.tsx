import React, {useState, useEffect, useRef, useContext} from "react";
import "../../css/chatbot.css"; // Ensure to include your CSS here

// import DynamicChart from "../../pages/Dashboard/dynamicChart.tsx";
import {LexChartSlots, LexChartSlotsContext} from "../RouterRoot.tsx";


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
    const [isWaitingForBot, setIsWaitingForBot] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [sessionAttributes, setSessionAttributes] = useState<Record<string, string>>({})
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
    const {setChartSlots} = useContext(LexChartSlotsContext)

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
    const getLexChartSlots = (lexResponse: any): LexChartSlots => {
        let lexSlots = lexResponse.sessionState.intent.slots
        const lexChartSlots: LexChartSlots = {ProgramNameSlot: undefined, AnalyzeSchoolSlot: undefined, CompareSchoolSlot: undefined, AnalyzeVocationalSlot: undefined, CompareVocationalSlot: undefined, CompareUniversityWUniSlot: undefined, CompareSpecificInstitutesSlot: undefined, CompareUniversityWProgramsSlot: undefined}
        if ('OtherIntent' === lexResponse.sessionState.intent.name && 'slots' in lexResponse.sessionState.sessionAttributes) {
            lexSlots = JSON.parse(lexResponse.sessionState.sessionAttributes.slots)
        }
        Object.keys(lexSlots).map((slot) => {
            console.log("Checking slot " + slot)
            if (slot in lexChartSlots && lexSlots[slot]) {
                console.log(`Found slot ${slot}`)
                lexChartSlots[slot as keyof LexChartSlots] = lexSlots[slot].value.interpretedValue
            }
        })
        return lexChartSlots
    }

    const disableButtons = () => {
        const buttons = chatListRef?.current?.getElementsByTagName('input')
        if (buttons) {
            const buttonsArray = Array.from(buttons)
            buttonsArray.map((button) => button.disabled = true)
        }
    }

    const messageLex = async (message: string | undefined, options: {retry?: "true" | "false", return?: "true" | "false",} = {retry: 'false', return: 'false'}) => {
        if (isWaitingForBot) return
        try {
            setIsWaitingForBot(true)
            if (message)
                addMessage({author: "human", body: message});

            addMessage({author: "loading", body: "(Thinking...)"})

            const sessionId = await startSession()
            const lexOptions: Record<string, any> = {...sessionAttributes, ...options}
            console.log("Lex options are: ", options)
            console.log("Lex combined options are: ", lexOptions)
            const lexResponse = await fetch(`${import.meta.env.VITE_API_URL}/lex/message-lex`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: message, sessionId: sessionId, options: lexOptions }),
            });
            if (!lexResponse.ok) {
              throw Error("Could not send request.")
            }
            const result = await lexResponse.json()
            const body = result.response
            const attr = body.sessionState.sessionAttributes
            setSessionAttributes(attr)
            setChartSlots(getLexChartSlots(body))
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
        } finally {
            setIsWaitingForBot(false)
            disableButtons()
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isWaitingForBot) return
        const input = (e.target as HTMLFormElement).elements.namedItem(
            "input"
        ) as HTMLInputElement;
        const message = input.value;
        const inputPlaceholder = input.placeholder

        input.value = "";
        input.disabled = true;
        input.placeholder = "Waiting for response..."

        await messageLex(message)

        input.disabled = false;
        input.placeholder = inputPlaceholder
        input.focus()
    };

    const returnToMenu = () => messageLex(undefined, {return: "true"})

    const retrySlot = () => messageLex(undefined, {retry: "true"})

    useEffect(() => {
        if (isInitialized.current) return;
        returnToMenu()
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
                            id={'chat-message-' + index}
                            className={`c-chat__item ${message.author === "human" ? "c-chat__item--human" : ""}`}
                        >
                            <div className={`c-chat__message ${message.author === "human" ? "bg-lightblue" : "bg-primary"}`}>
                                {typeof message.body === "string" ? (
                                    <span
                                        className={`whitespace-pre-line ${message.author === "loading" ? "c-chat__item--loading" : ""}`}
                                    >{message.body}</span>
                                ) : (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg">{message.body.title}</span>
                                        <span className="">{message.body.subtitle}</span>
                                            <hr className="my-2 border-1 border-whiter"/>
                                        <span>{message.body.buttons.map((btn, i) => (
                                            <input type="button" value={btn.text} key={i} onClick={async () => {
                                                    await messageLex(btn.value)
                                                }}
                                                className="bg-lightblue whitespace-break-spaces text-white px-2 py-1 mx-1 rounded my-2 cursor-pointer disabled:bg-lightblue-700 disabled:cursor-default disabled:text-stroke"/>
                                        ))}</span>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>

            {/* Chat Input Form */}
            <form className="c-chat__form flex-wrap gap-2 bg-whiten rounded-b-md" onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="input"
                    placeholder="Type your message here..."
                    autoFocus
                    autoComplete="off"
                    required
                    className="grow-[10] p-2"
                />
                <div className="flex flex-1 gap-2 h-[40px]">
                    <input
                        type="button"
                        name="back"
                        value="Back"
                        className="bg-graydark text-white rounded cursor-pointer px-3 shrink"
                        onClick={retrySlot}
                    />
                    <input
                        type="button"
                        name="return"
                        value="Main Menu"
                        className="bg-lightblue text-white rounded cursor-pointer px-3 grow"
                        onClick={returnToMenu}
                    />
                </div>
            </form>
        </div>
    );
};

export default Chat;
