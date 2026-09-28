import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../hooks/useAI';
import useAuthStore from '../../store/auth.store';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, Minimize2 } from 'lucide-react';

const AIChatbotWidgetInner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your EMS AI Assistant powered by Google Gemini. How can I help you with workforce analytics, policies, or operations today?'
    }
  ]);

  const messagesEndRef = useRef(null);
  const chatMutation = useAIChat();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');

    chatMutation.mutate(
      { message: currentInput },
      {
        onSuccess: (data) => {
          const aiReply = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: data.message || 'I have processed your request.'
          };
          setMessages((prev) => [...prev, aiReply]);
        }
      }
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 border border-indigo-400/30 group"
          id="ems-ai-assistant-toggle"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <span className="text-sm font-semibold tracking-wide">EMS AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[540px] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  EMS AI Assistant
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    Gemini 1.5 Flash
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Always available & 24h cached</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-800/90 text-slate-400 border border-slate-700/60 rounded-2xl px-3.5 py-2 text-xs flex items-center gap-1.5">
                  <span>Gemini is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about policies, leaves, attendance..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const AIChatbotWidget = () => {
  const { user } = useAuthStore();
  const primaryRole = user?.role || user?.roles?.[0] || 'EMPLOYEE';
  const isAllowed = ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(primaryRole);

  if (!isAllowed) {
    return null;
  }

  return <AIChatbotWidgetInner />;
};

export default AIChatbotWidget;
