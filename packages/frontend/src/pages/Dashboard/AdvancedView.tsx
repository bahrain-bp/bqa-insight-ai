import React, { useState, useRef, useContext } from 'react';
import { ChartContext } from "../../components/RouterRoot";
import { jsPDF } from "jspdf";
import { Send, FileDown, FileText, Clock, MessageSquare } from 'lucide-react';

interface ImageResponseCard {
  title: string;
  subtitle?: string;
  buttons: Array<{
    text: string;
    value: string;
  }>;
}

interface Message {
  type: 'user' | 'bot' | 'loading' | 'card';
  content: string | ImageResponseCard;
  timestamp: string;
}

const AdvancedView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { chartJson, setChartJson } = useContext(ChartContext);

  const startSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/lex/start-session`, {
        method: "POST",
      });
      const data = await response.json();
      if (!data.sessionId) throw new Error("Session not started");
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error("Could not start session.", error);
      throw error;
    }
  };

  const scrollToBottom = () => {
    if (chatRef.current) {
      setTimeout(() => {
        chatRef.current?.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const handleSendMessage = async (message: string): Promise<void> => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      // Add user message
      setMessages(prev => [...prev, {
        type: 'user',
        content: message,
        timestamp: new Date().toLocaleString()
      }]);
      scrollToBottom(); // Scroll after user message

      // Add loading message
      setMessages(prev => [...prev, {
        type: 'loading',
        content: 'Thinking...',
        timestamp: new Date().toLocaleString()
      }]);
      scrollToBottom(); // Scroll after loading message

      const sid = await startSession();
      const lexResponse = await fetch(`${import.meta.env.VITE_API_URL}/lex/message-lex`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, sessionId: sid }),
      });

      if (!lexResponse.ok) throw Error("Could not send request.");

      const result = await lexResponse.json();
      const body = result.response;
      console.log("lex response:", body);

      // Replace loading message with actual response
      if (body.messages && body.messages[0]) {
        if (body.messages[0].contentType === "ImageResponseCard") {
          setMessages(prev => prev.slice(0, -1).concat({
            type: 'card',
            content: body.messages[0].imageResponseCard,
            timestamp: new Date().toLocaleString()
          }));
        } else {
          if (!body.messages[0].content) throw Error("Empty message");
          setMessages(prev => prev.slice(0, -1).concat({
            type: 'bot',
            content: body.messages[0].content,
            timestamp: new Date().toLocaleString()
          }));
        }
        scrollToBottom(); // Scroll after bot response
      }

    } catch (error) {
      console.error("Error:", error);
      // Remove loading message and add error message
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => msg.type !== 'loading');
        return [...withoutLoading, {
          type: 'bot',
          content: "An error occurred. Please try again.",
          timestamp: new Date().toLocaleString()
        }];
      });
      scrollToBottom(); // Scroll after error message
    } finally {
      setIsLoading(false);
      setInputValue("");
    }
  };

  const shouldIncludeInReport = (content: string | ImageResponseCard): boolean => {
    if (typeof content !== 'string') return false;
    return !content.includes('?');
    //&& !content.startsWith('invoke bedrock');
  };

  const exportToPDF = (): void => {
    const doc = new jsPDF();
    let yOffset = 20;

    doc.setFontSize(16);
    doc.text("Analysis Report", 20, yOffset);
    yOffset += 20;

    doc.setFontSize(12);
    messages.forEach((msg) => {
      if (msg.type === 'user' || (msg.type === 'bot' && shouldIncludeInReport(msg.content))) {
        if (yOffset > 270) {
          doc.addPage();
          yOffset = 20;
        }

        const content = typeof msg.content === 'string' ? msg.content : '';
        const lines = doc.splitTextToSize(content, 170);

        doc.text(lines, 20, yOffset);
        yOffset += 10 * lines.length + 5;
      }
    });

    doc.save("analysis-report.pdf");
  };

  const exportToWord = (): void => {
    let content = '<html><body>';
    content += '<h1>Analysis Report</h1>';

    messages.forEach((msg) => {
      if (msg.type === 'user' || (msg.type === 'bot' && shouldIncludeInReport(msg.content))) {
        const prefix = msg.type === 'user' ? '<strong>User:</strong> ' : '<strong>Response:</strong> ';
        const text = typeof msg.content === 'string' ? msg.content : '';
        content += `<p>${prefix}${text}</p>`;
      }
    });

    content += '</body></html>';

    const blob = new Blob([content], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analysis-report.doc';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const renderMessage = (msg: Message) => {
    if (msg.type === 'loading') {
      return (
          <div className="flex justify-center">
            <div className="animate-pulse text-gray-400">{msg.content}</div>
          </div>
      );
    }

    if (msg.type === 'card') {
      const card = msg.content as ImageResponseCard;
      return (
          <div className="flex justify-start">
            <div className="bg-primary rounded-lg p-4 max-w-[80%] border border-gray-700">
              <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
              {card.subtitle && <p className="text-gray-300 mb-3">{card.subtitle}</p>}
              <div className="flex flex-wrap gap-2">
                {card.buttons.map((button, i) => (
                    <button
                        key={i}
                        onClick={() => handleSendMessage(button.value)}
                        className="bg-meta-3 text-white px-3 py-1.5 rounded hover:bg-meta-4 transition-colors"
                    >
                      {button.text}
                    </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {msg.timestamp}
              </p>
            </div>
          </div>
      );
    }

    const isUser = msg.type === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`${isUser ? 'bg-meta-6' : 'bg-primary'} rounded-lg p-4 max-w-[80%] ${!isUser && 'border border-gray-700'}`}>
            <p className="text-white">{msg.content as string}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {msg.timestamp}
            </p>
          </div>
        </div>
    );
  };

  return (
      <div className="flex flex-col h-[calc(100vh-160px)]">
        {/* Header */}
        <div className="bg-boxdark border-b border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Advanced Analysis
            </h2>
            <div className="flex gap-2">
              <button
                  onClick={exportToPDF}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-meta-3 text-white hover:bg-meta-4 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
              <button
                  onClick={exportToWord}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-meta-5 text-white hover:bg-meta-6 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Export Word
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Messages Area */}
            <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-4 space-y-6"
            >
              {messages.map((msg, idx) => (
                  <div key={idx}>
                    {renderMessage(msg)}
                  </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 p-3 rounded-lg bg-primary border border-gray-700 text-bodydark1 focus:outline-none focus:border-meta-3"
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        handleSendMessage(inputValue);
                      }
                    }}
                />
                <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={isLoading}
                    className="p-3 rounded-lg bg-meta-3 text-white hover:bg-meta-4 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdvancedView;