import { useEffect, useRef, useState } from "react";
import client from "../api/client";

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything about your finances — like \"how much did I spend on groceries this month?\" 💰" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || thinking) return;

    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setThinking(true);
    try {
      const { data } = await client.post("/ai/chat", {
        question,
        history: newMessages.slice(-8), // last 8 turns as context
      });
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't process that right now. Try again in a moment." }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-violet-600 text-white text-2xl shadow-lg shadow-violet-600/30 hover:bg-violet-700 cursor-pointer transition-transform hover:scale-105"
        aria-label="AI assistant"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 h-[480px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-gray-400/20 dark:shadow-black/40 flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-4">
            <p className="font-bold">✨ FinSight Assistant</p>
            <p className="text-xs text-white/70">Answers from your own data</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-violet-600 text-white rounded-br-md"
                    : "bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded-bl-md"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-gray-400">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
            <input
              className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ask about your spending..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              disabled={thinking || !input.trim()}
              className="bg-violet-600 text-white px-4 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 cursor-pointer"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}