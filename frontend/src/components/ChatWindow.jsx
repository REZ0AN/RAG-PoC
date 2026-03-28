import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

const SUGGESTIONS = [
  'Summarize my documents',
  'What are the key points?',
  'Find specific information',
  'Compare topics in my files',
]

export default function ChatWindow({ room, messages, streamingMsg, isStreaming, onSend, onStop }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMsg])

  const hasMessages = messages.length > 0 || streamingMsg !== null

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-bg min-w-0">

      {/* Header — only when there are messages */}
      {hasMessages && room && (
        <header className="flex-shrink-0 flex items-center h-13 px-6 border-b border-border">
          <span className="text-sm font-medium text-sub truncate">{room.name}</span>
        </header>
      )}

      {/* Scrollable message area OR hero */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center">
        {!hasMessages ? (
          /* ── Hero ── */
          <div className="flex-1 flex flex-col items-center justify-center w-full px-6 pb-8 gap-7">
            <h1 className="text-2xl font-semibold text-primary tracking-tight text-center">
              {room ? "What's on your mind?" : 'Where should we begin?'}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="px-4 py-2 bg-surface border border-border rounded-full text-sm text-sub hover:bg-hover hover:text-primary hover:border-[#3a3a3a] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Thread ── */
          <div className="w-full max-w-[720px] px-4 md:px-6 py-6 flex flex-col gap-1">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {streamingMsg !== null && (
              <MessageBubble
                message={{ role: 'assistant', content: streamingMsg }}
                isStreaming={isStreaming}
              />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input — always at bottom, centered */}
      <div className="flex-shrink-0 flex flex-col items-center px-4 md:px-6 pb-5 pt-3 bg-bg">
        <ChatInput
          onSend={onSend}
          onStop={onStop}
          isStreaming={isStreaming}
          className="w-full max-w-[720px]"
        />
        <p className="text-[11px] text-muted mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}