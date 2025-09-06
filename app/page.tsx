'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import classNames from 'classnames'

const starters = [
  'Build a 90 day fundraising plan',
  'Help me map my community and find on-ramps',
  'Outline a launch team pathway with milestones',
  'Create a weekly prayer rhythm for our core team',
  'Set up a simple budget for year one'
]

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
    initialMessages: [
      { id: 'sys', role: 'assistant', content: 'Hi! I can help you plan and take next steps. What are you working on right now?' }
    ],
  })
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-6">
      <section className="bg-white border rounded-2xl p-4 lg:p-6 shadow-sm">
        <div ref={listRef} className="h-[55vh] lg:h-[62vh] overflow-y-auto pr-1">
          {messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => (
              <Message key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} />
            ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <Loader2 className="size-4 animate-spin" /> Thinking...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about fundraising, team building, legal setup, worship, discipleship and more..."
            className="flex-1 rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 min-h-[44px] max-h-40"
          />
          <button
            type="submit"
            className={classNames(
              'inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium',
              'bg-brand text-white hover:bg-brand-dark focus:ring-2 focus:ring-brand/40'
            )}
            disabled={isLoading}
          >
            Send <ArrowUpRight className="size-4" />
          </button>
        </form>
      </section>

      <aside className="space-y-3">
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <h3 className="font-medium mb-2">Starter prompts</h3>
          <div className="flex flex-col gap-2">
            {starters.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-left text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <ExportBlock messages={messages} />
      </aside>
    </div>
  )
}

function Message({ role, content }: { role: 'assistant' | 'user'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={classNames('mb-4', isUser ? 'text-right' : 'text-left')}>
      <div
        className={classNames(
          'inline-block whitespace-pre-wrap px-4 py-3 rounded-2xl text-sm',
          isUser ? 'bg-brand text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        )}
      >
        {content}
      </div>
    </div>
  )
}

function ExportBlock({ messages }: { messages: any[] }) {
  function exportMarkdown() {
    const md = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => `${m.role === 'user' ? '### You' : '### Coach'}\n\n${m.content}`)
      .join('\n\n---\n\n')
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'church-tech-chat.md'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <h3 className="font-medium mb-2">Export</h3>
      <button onClick={exportMarkdown} className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 w-full">
        Download conversation as Markdown
      </button>
    </div>
  )
}
