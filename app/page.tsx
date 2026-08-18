'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

/**
 * TokenGuard forwards to the upstream your credential belongs to, so a model is
 * only reachable if you added that provider's key in the dashboard. Ids are the
 * provider's own — TokenGuard prices these exactly rather than estimating.
 */
const MODEL_GROUPS = [
  {
    provider: 'Anthropic',
    models: [
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5 (fast & cheap)' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
    ],
  },
  {
    provider: 'OpenAI',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (fast & cheap)' },
      { id: 'gpt-4o', name: 'GPT-4o' },
    ],
  },
];

/** The route replies with `{ error }`; surface that rather than the raw body. */
function readableError(error: Error): string {
  try {
    const parsed = JSON.parse(error.message);
    if (parsed && typeof parsed.error === 'string') return parsed.error;
  } catch {
    /* not JSON - fall through */
  }
  return error.message;
}

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState(MODEL_GROUPS[0].models[0].id);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ model: selectedModel }),
    }),
  });

  const busy = status === 'submitted' || status === 'streaming';

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    sendMessage({ text });
  }

  return (
    <main className="flex flex-col h-screen max-w-3xl mx-auto p-4 bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h1 className="font-semibold text-lg">AI Chatbot Starter</h1>
        </div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {MODEL_GROUPS.map((group) => (
            <optgroup key={group.provider} label={group.provider}>
              {group.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </header>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && !error && (
          <div className="text-center text-zinc-500 my-auto pt-20">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Every token is metered and capped by TokenGuard.</p>
            <p className="text-xs mt-1 text-zinc-600">
              Pick a model your TokenGuard credential can reach.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
              }`}
            >
              {m.parts
                .filter((part) => part.type === 'text')
                .map((part) => part.text)
                .join('')}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="text-sm text-red-300 bg-red-950/50 border border-red-900 rounded-xl p-3">
            {readableError(error)}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="relative pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="absolute right-2 top-3.5 p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black rounded-full transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </main>
  );
}
