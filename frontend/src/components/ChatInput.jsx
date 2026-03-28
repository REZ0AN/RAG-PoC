import { useRef, useEffect } from 'react'
import { ArrowUp, Square } from 'lucide-react'

export default function ChatInput({ onSend, onStop, isStreaming, disabled, className = '' }) {
  const ref = useRef()

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + 'px'
  })

  const send = () => {
    const val = ref.current?.value.trim()
    if (!val || isStreaming) return
    onSend(val)
    ref.current.value = ''
    ref.current.style.height = 'auto'
  }

  return (
    <div className={`flex items-end gap-2 bg-surface border border-border rounded-xl px-4 py-3 shadow-md focus-within:border-[#404040] transition-colors ${className}`}>
      <textarea
        ref={ref}
        rows={1}
        placeholder="Ask anything…"
        disabled={disabled}
        className="flex-1 bg-transparent border-none outline-none resize-none text-primary text-sm leading-relaxed placeholder-muted min-h-[22px] max-h-[160px] overflow-y-auto font-[inherit]"
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
        }}
      />
      {isStreaming ? (
        <button
          onClick={onStop}
          className="w-8 h-8 rounded-lg bg-accent hover:bg-accent-h flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <Square size={12} fill="white" color="white" />
        </button>
      ) : (
        <button
          onClick={send}
          disabled={disabled}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:bg-active disabled:cursor-default bg-accent hover:bg-accent-h"
        >
          <ArrowUp size={14} color="white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}