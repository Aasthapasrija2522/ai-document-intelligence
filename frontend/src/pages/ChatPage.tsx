import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import {
  createChatSession,
  listChatSessions,
  getSessionMessages,
  sendChatMessage,
} from '../api/chat';
import type { ChatSession, ChatMessage, MessageRole } from '../types';

const ROLE_LABEL: Record<MessageRole, string> = {
  user: 'You',
  assistant: 'Assistant',
};

const ROLE_ALIGN: Record<MessageRole, string> = {
  user: 'justify-end',
  assistant: 'justify-start',
};

const ROLE_BG: Record<MessageRole, string> = {
  user: '#C9A24B',
  assistant: '#161C29',
};

const ROLE_TEXT: Record<MessageRole, string> = {
  user: '#10151F',
  assistant: '#ECEEF3',
};

function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await listChatSessions();
        setSessions(response.data);
        if (response.data.length > 0) {
          setActiveSessionId(response.data[0].id);
        }
      } catch {
        setSessions([]);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId === null) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await getSessionMessages(activeSessionId);
        setMessages(response.data);
      } catch {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewSession = async () => {
    try {
      const response = await createChatSession(`Chat ${sessions.length + 1}`);
      setSessions((prev) => [response.data, ...prev]);
      setActiveSessionId(response.data.id);
    } catch {
      setError('Failed to create a new chat session.');
    }
  };

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || activeSessionId === null || sending) return;

    const optimisticUserMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    setSending(true);
    setError('');

    try {
      const response = await sendChatMessage(activeSessionId, messageToSend);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMessage.id),
        response.data.user_message,
        response.data.assistant_message,
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to send message.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#10151F' }}>
      {/* Sidebar */}
      <div className="w-64 border-r p-4 flex flex-col" style={{ borderColor: '#2A3346' }}>
        <p
          className="text-[11px] tracking-[0.2em] uppercase mb-3"
          style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Sessions
        </p>
        <button
          onClick={handleNewSession}
          className="mb-4 py-2 text-xs uppercase tracking-wide"
          style={{ backgroundColor: '#C9A24B', color: '#10151F', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
        >
          + New chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className="block w-full text-left px-3 py-2 text-sm truncate"
              style={{
                backgroundColor: session.id === activeSessionId ? '#161C29' : 'transparent',
                color: session.id === activeSessionId ? '#ECEEF3' : '#8791A8',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {session.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeSessionId === null && (
            <p className="text-sm" style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}>
              Start a new chat to begin asking questions about your documents.
            </p>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${ROLE_ALIGN[msg.role]}`}>
              <div
                className="max-w-md px-4 py-2"
                style={{ backgroundColor: ROLE_BG[msg.role], color: ROLE_TEXT[msg.role] }}
              >
                <p
                  className="text-[10px] uppercase tracking-wide mb-1 opacity-70"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {ROLE_LABEL[msg.role]}
                </p>
                <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-2" style={{ backgroundColor: '#161C29' }}>
                <p className="text-sm" style={{ color: '#5FB8B0', fontFamily: "'IBM Plex Mono', monospace" }}>
                  Retrieving and generating\u2026
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <p className="px-6 text-sm" style={{ color: '#C1523A', fontFamily: "'Inter', sans-serif" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2" style={{ borderColor: '#2A3346' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your documents…"
            disabled={activeSessionId === null || sending}
            className="flex-1 px-3 py-2 bg-transparent border outline-none"
            style={{ borderColor: '#2A3346', color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}
          />
          <button
            type="submit"
            disabled={activeSessionId === null || sending}
            className="px-5 py-2 text-sm uppercase tracking-wide"
            style={{
              backgroundColor: sending || activeSessionId === null ? '#2A3346' : '#C9A24B',
              color: sending || activeSessionId === null ? '#8791A8' : '#10151F',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;