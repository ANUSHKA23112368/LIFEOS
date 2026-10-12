import React, { useState, useEffect } from 'react';
import { AiChatMessage, AiQueryResponse } from '../types';
import { api } from '../services/api';
import { Sparkles, Send, Trash2, Bot, User, ArrowRight } from 'lucide-react';

export const AiAnalystPage: React.FC = () => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    'How did I spend my time this week?',
    'Why did I complete fewer tasks than planned?',
    'Which activities repeatedly take longer than estimated?',
    'What schedule adjustments do you suggest for tomorrow?',
  ];

  const loadHistory = async () => {
    try {
      const hist = await api.getAiHistory();
      setMessages(hist);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSend = async (q?: string) => {
    const questionText = q || inputQuestion;
    if (!questionText.trim()) return;

    setInputQuestion('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: AiChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: questionText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const resp = await api.queryAi(questionText);
      const assistantMsg: AiChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: resp.answer,
        insights: resp.insights,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      const errMsg: AiChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `Error: ${e.message || 'Unable to analyze records'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear conversational history?')) {
      await api.clearAiHistory();
      setMessages([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Ten
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Sparkles size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>AI Life Analyst</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grounded in your real database records. Explains what happened, the supporting evidence, and suggested experiments.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-800 rounded-lg transition"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Suggested Starter Questions */}
      <div className="flex flex-wrap gap-2">
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition text-left"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 min-h-[350px]">
        {messages.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
            <Bot size={36} className="text-indigo-500" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">Your Personal Life Intelligence Analyst</p>
            <p className="max-w-md text-slate-500">
              Ask about your recorded activities, plan vs actual time differences, or how to design a more sustainable schedule.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={15} />
                </div>
              )}
              <div
                className={`max-w-xl p-4 rounded-2xl space-y-2 ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                }`}
              >
                <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>

                {/* Structured Insights Cards */}
                {m.insights && m.insights.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {m.insights.map((ins, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">{ins.title}</div>
                        <div>
                          <strong>What was observed: </strong>
                          {ins.what_i_observed}
                        </div>
                        <div>
                          <strong>Evidence: </strong>
                          {ins.evidence}
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400">
                          <strong>Suggested experiment: </strong>
                          {ins.suggested_experiment}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          <strong>How to evaluate: </strong>
                          {ins.how_to_evaluate}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  U
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 text-xs items-center text-slate-400">
            <Bot size={16} className="text-indigo-500 animate-pulse" />
            <span>Analyzing your verified database records...</span>
          </div>
        )}
      </div>

      {/* Question Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask about your recorded activities, focus patterns, or habits..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          className="flex-1 px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={loading || !inputQuestion.trim()}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send size={14} />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
