import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Send, Bot, User, Shield, PhoneCall, Minimize2, Sparkles } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Namaste! I am Rakshak, your AI Citizen Legal & Public Safety Assistant. How can I assist you with Indian police procedures, reporting an incident, or citizen rights today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 10));

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyPayload = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', {
        message: text.trim(),
        sessionId: sessionId,
        conversationHistory: historyPayload
      });

      if (res.data && res.data.data) {
        const botReply = res.data.data.reply;
        const sections = res.data.data.relevantSections || [];
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: botReply, sections: sections }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection error. For immediate police emergency, please dial 112 or 1930 for cyber fraud.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What are my rights if arrested under BNSS?",
    "How to report financial cyber fraud (1930)?",
    "What is a Zero-FIR and when can I file it?",
    "Can a woman be arrested after sunset?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-full bg-amber-400 text-slate-950 font-bold shadow-xl hover:scale-105 hover:bg-amber-500 transition-all duration-200 border border-amber-300"
        >
          <div className="p-1 rounded-full bg-slate-950/10">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xs font-extrabold tracking-wide">Legal AI Desk (Rakshak)</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[550px] bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900">
          {/* Header */}
          <div className="bg-amber-400 px-4 py-3 border-b border-amber-300 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-950/10 flex items-center justify-center text-slate-950">
                <Shield className="w-5 h-5 font-bold" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm text-slate-950">Rakshak AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-slate-950 font-bold border border-amber-300">
                    BNS &amp; BNSS
                  </span>
                </div>
                <p className="text-[11px] text-slate-800 font-medium">Citizen Legal &amp; Public Safety Assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-800 hover:text-slate-950 rounded-lg hover:bg-amber-300 transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Emergency Helpline Ticker */}
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <span className="flex items-center">
              <PhoneCall className="w-3 h-3 mr-1 text-amber-700" />
              Emergency: <strong>112</strong> | Cyber Fraud: <strong>1930</strong>
            </span>
            <span className="text-slate-500 text-[10px] font-semibold">24x7 Active</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    m.role === 'user'
                      ? 'bg-amber-400 text-slate-950 font-medium rounded-br-none shadow-sm'
                      : m.isError
                      ? 'bg-red-50 text-red-900 border border-red-300 rounded-bl-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

                  {/* Section badges if present */}
                  {m.sections && m.sections.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {m.sections.map((sec, i) => (
                        <span
                          key={i}
                          className="bg-amber-50 text-amber-900 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 font-semibold"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-500 text-xs">
                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 animate-spin">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Rakshak is analyzing legal provisions...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex overflow-x-auto gap-1.5 scrollbar-none">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 text-[11px] font-semibold transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about legal rights, filing e-FIR, cyber fraud..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-slate-950 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-[10px] text-center text-slate-400 mt-1 font-medium">
              Powered by OpenRouter AI | Confined to Indian Law &amp; Citizen Safety
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
