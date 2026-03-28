import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function MessageBubble({ message, isStreaming }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 py-2 ${isUser ? 'justify-end' : 'justify-start'} group`}>

      {/* Bot avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-[10px] font-bold">
          AI
        </div>
      )}

      {/* Bubble */}
      <div className={`relative ${isUser ? 'max-w-[72%]' : 'max-w-[85%]'}`}>
        {isUser ? (
          /* User — pill with surface bg */
          <div className="px-4 py-2.5 bg-surface border border-border rounded-2xl rounded-tr-sm text-primary text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          /* Assistant — no bubble, raw text */
          <div>
            <div className="prose-chat">
              <ReactMarkdown
                components={{
                  code({ inline, className, children }) {
                    const lang = /language-(\w+)/.exec(className || '')?.[1] || 'text'
                    if (inline) return <code className={className}>{children}</code>
                    return <CodeBlock lang={lang}>{String(children).replace(/\n$/, '')}</CodeBlock>
                  }
                }}>
                {message.content}
              </ReactMarkdown>
            </div>

            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-accent rounded-sm align-middle ml-0.5 animate-blink" />
            )}

            {/* Copy button */}
            {!isStreaming && message.content && (
              <button
                onClick={copy}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-muted hover:text-sub transition-colors opacity-0 group-hover:opacity-100"
              >
                {copied
                  ? <><Check size={11} className="text-accent" /> Copied</>
                  : <><Copy size={11} /> Copy</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-active flex items-center justify-center flex-shrink-0 mt-0.5 text-sub text-[11px] font-bold">
          U
        </div>
      )}
    </div>
  )
}

function CodeBlock({ lang, children }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-border">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-[#111] px-4 py-2 border-b border-border">
        <span className="text-[11px] text-muted font-mono">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-muted hover:text-sub transition-colors"
        >
          {copied
            ? <><Check size={11} className="text-accent" /> Copied</>
            : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      {/* Code body */}
      <SyntaxHighlighter
        style={oneDark}
        language={lang}
        PreTag="div"
        customStyle={{
          margin: 0, borderRadius: 0,
          fontSize: 13, background: '#161616',
          padding: '14px 16px',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}