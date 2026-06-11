/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Send,
  Trash2,
  X,
  Compass,
  MessageSquare,
  Dot,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function AICopilotPanel() {
  const {
    chatHistory,
    chatLoading,
    sendMessageToAI,
    clearChat,
    selectedModel
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    { text: "Which model has the highest accuracy?", desc: "Compare metrics" },
    { text: "Why is forecast confidence low?", desc: "Assess variance" },
    { text: "Show expected revenue for next quarter.", desc: "Sales projection" },
    { text: "How does competitor pricing affect demand?", desc: "Price Elasticity" }
  ];

  // Auto scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;
    
    setInputText('');
    await sendMessageToAI(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Sparkle Action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="copilot_launcher_btn"
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-2xl hover:scale-105 duration-200 cursor-pointer flex items-center space-x-2 animate-bounce hover:animate-none"
      >
        <Sparkles className="h-5 w-5 animate-pulse" />
        <span className="text-xs font-semibold pr-1">Ask AI Assistant</span>
      </button>

      {/* Slide-out Sidebar Copilot Panel */}
      {isOpen && (
        <div
          id="copilot_sliding_panel"
          className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/10 dark:bg-slate-900 flex items-center justify-between" id="copilot_header">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
              <div>
                <h3 className="font-display font-bold text-xs text-slate-800 dark:text-white">AI Co-pilot Assistant</h3>
                <span className="text-[9px] text-indigo-400 font-mono flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-1 animate-ping"></span>
                  Gemini 3.5 Flash Active
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1" id="copilot_header_actions">
              <button
                onClick={clearChat}
                id="clear_chat_icon_btn"
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
                title="Clear conversational logs"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                id="close_copilot_panel_btn"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Grid Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" id="copilot_message_grid">
            {/* Active Model Context Tracker Badge */}
            {selectedModel && (
              <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/40 text-[10px] text-slate-500 dark:text-slate-450 flex items-center space-x-2 animate-fade-in" id="chat_context_badge">
                <Compass className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="leading-normal">
                  Providing insights on active: <strong className="text-slate-700 dark:text-slate-300 font-medium">{selectedModel.name}</strong>
                </span>
              </div>
            )}

            {/* Conversation list */}
            {chatHistory.map(msg => (
              <div
                key={msg.id}
                id={`chat_msg_${msg.id}`}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed leading-[1.375rem] border ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-tl-none font-sans'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Simulated typers */}
            {chatLoading && (
              <div className="flex justify-start items-center space-x-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-[80%]" id="chat_typing_indicator">
                <div className="flex space-x-1" id="typing_dots">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce delay-100"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce delay-200"></div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Formulating regression curves...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick-Prompt Suggestions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/30 space-y-1.5" id="copilot_suggestions">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 flex items-center">
              <Lightbulb className="h-3 w-3 mr-1 text-amber-500" /> Suggested Queries
            </span>
            <div className="grid grid-cols-2 gap-1.5" id="copilot_suggestions_grid">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.text)}
                  className="p-1.5 rounded bg-white dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800/80 text-[10px] text-left text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-all duration-150 line-clamp-2"
                >
                  <p className="font-semibold truncate">{q.text}</p>
                  <span className="text-[8.5px] font-mono text-slate-400">{q.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Typing input bar footer */}
          <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2" id="copilot_footer_input">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              id="copilot_chat_input"
              placeholder="Ask me to explain models, anomalies or trends..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-3 py-2.5 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleSend()}
              id="copilot_send_btn"
              disabled={!inputText.trim() || chatLoading}
              className={`p-2.5 rounded-lg text-white cursor-pointer transition-all ${
                inputText.trim() && !chatLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-600/10'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
