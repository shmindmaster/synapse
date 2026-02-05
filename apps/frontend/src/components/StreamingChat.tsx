/**
 * Modern Chat Component using React 19 patterns
 * Features: Suspense, useOptimistic, streaming SSE
 */
import { Loader2, Send, StopCircle } from 'lucide-react';
import { Suspense, useEffect, useOptimistic, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isOptimistic?: boolean;
}

interface StreamingChatProps {
  sessionId: string;
  onError?: (error: Error) => void;
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function StreamingChat({ sessionId, onError }: StreamingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [optimisticMessages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      isOptimistic: true,
    };

    // Optimistically add user message
    addOptimisticMessage(userMessage);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Actually commit user message
      setMessages(prev => [...prev, { ...userMessage, isOptimistic: false }]);

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content' && parsed.content) {
                assistantContent += parsed.content;
                setStreamingContent(assistantContent);
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Stream error');
              }
            } catch (err) {
              console.error('Failed to parse SSE data:', err);
            }
          }
        }
      }

      // Commit assistant message
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') return;
        onError?.(error);
        console.error('Chat error:', error);
      }
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.isOptimistic));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Suspense fallback={<ChatSkeleton />}>
          {optimisticMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${
                msg.isOptimistic ? 'opacity-50' : ''
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.isOptimistic && (
                  <span className="text-xs opacity-75 mt-1 block">Sending...</span>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                <Loader2 className="w-4 h-4 animate-spin mt-2" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </Suspense>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Error boundary for Suspense
export function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
