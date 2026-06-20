"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import api from "@/lib/api";

interface ChatMessage {
  role: "user" | "model";
  message: string;
}

const QUICK_SUGGESTIONS = [
  "Summarize my spending this month",
  "How much budget is left in Food?",
  "Check my budget alert statuses",
  "How is my savings rate compared to spending?"
];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: "model",
      message: "Hello! I am your FinSight AI financial assistant. Ask me questions about your monthly summaries, budgets, categories, or recent transactions!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isOpen, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", message: textToSend };
    setHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      // Map frontend ChatMessage schema to backend DTO schema (message, history)
      const mappedHistory = history.map((msg) => ({
        role: msg.role,
        message: msg.message
      }));

      // Slice history to include last 20 messages for prompt token size management
      const response = await api.post("/ai/chat", {
        message: textToSend,
        history: mappedHistory.slice(-20)
      });

      const replyText = response.data.data.reply;
      setHistory((prev) => [...prev, { role: "model", message: replyText }]);
    } catch (error: any) {
      const errorText = error.response?.data?.message || "I had trouble connecting to the backend. Please check if your server is running and the GEMINI_API_KEY is set.";
      setHistory((prev) => [
        ...prev,
        { role: "model", message: `System Error: ${errorText}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(message);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="mb-4 flex h-[480px] w-[350px] flex-col rounded-2xl border border-white/5 bg-[#141416]/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="h-2 w-2 absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-[#141416]" />
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Icons.Sparkles className="h-4 w-4 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">FinSight AI Advisor</h4>
                <p className="text-[9px] text-emerald-400 font-medium">Assistant Active</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-[#8c8c99] hover:bg-white/5 hover:text-white transition"
            >
              <Icons.Minimize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs scrollbar-thin">
            {history.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2 leading-relaxed break-words border ${
                      isUser
                        ? "bg-indigo-500/10 text-[#ededed] border-indigo-500/20"
                        : "bg-[#1d1d21]/60 text-[#d1d1d6] border-white/5"
                    }`}
                  >
                    {/* Render simple newlines, bolding, and bullet points */}
                    <div className="whitespace-pre-line text-[11px] font-sans">
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-1.5 items-center rounded-xl bg-[#1d1d21]/60 border border-white/5 px-3.5 py-3.5 text-[#8c8c99]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c8c99] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c8c99] animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c8c99] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions List (Only show when not loading and when chat is at standard state) */}
          {!isLoading && history.length <= 2 && (
            <div className="flex flex-col gap-1.5 py-2 border-t border-white/5 mb-2">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#8c8c99] mb-0.5">Suggested Prompts</p>
              <div className="flex flex-wrap gap-1">
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="rounded-full border border-white/5 bg-[#1a1a1e] px-2.5 py-1 text-[10px] text-[#ededed] hover:bg-[#25252b] hover:border-white/10 transition text-left leading-normal"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-2 pt-2 border-t border-white/5">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a financial question..."
              className="flex-1 rounded-lg border border-white/5 bg-[#1a1a1e] px-3.5 py-2 text-xs outline-none focus:border-indigo-500/50 text-[#ededed]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition disabled:opacity-50"
            >
              <Icons.Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Sparkles Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-xl hover:scale-105 transition-all duration-300 hover:shadow-indigo-500/25 relative border border-white/10"
      >
        <Icons.MessageSquareCode className="h-5.5 w-5.5" />
        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-indigo-400 border-2 border-[#0d0d0f] animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-indigo-400 border-2 border-[#0d0d0f]" />
      </button>
    </div>
  );
}
