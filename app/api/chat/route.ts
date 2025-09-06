// app/api/chat/route.ts
import { NextRequest } from 'next/server'
import { streamText, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { loadIndex, retrieve } from '@/lib/rag'
import { systemPrompt } from '@/lib/prompt'

export const runtime = 'nodejs'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

function fail(status: number, message: string) {
  console.error(`[chat] ${message}`)
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain' } })
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      return fail(500, 'OPENAI_API_KEY missing in Production environment variables')
    }

    const { messages } = await req.json()
    const userMsg = messages?.filter((m: any) => m.role === 'user').pop()
    const userText: string = userMsg?.content ?? ''
    if (!userText) return fail(400, 'No user message content')

    // Load local index
    const index = await loadIndex()
    if (!index?.chunks?.length) {
      return fail(500, 'RAG index is empty or missing. Did you commit data/index.json after running npm run build-index?')
    }

    // Create one embedding vector for the query (embed() returns { embedding })
    const { embedding: queryVec } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: userText,
    })
    if (!queryVec?.length) return fail(500, 'Embedding creation failed')

    // Retrieve top-K chunks
    const topK = Number(process.env.RAG_TOP_K ?? 6)
    const hits = retrieve(index, queryVec as number[], topK)
    const context = hits.map(h => h.text).join('\n\n---\n\n')

    // Stream a response in the format useChat expects
    const result = await streamText({
      model: openai.chat(process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini') as any,
      temperature: 0.3,
      system: systemPrompt(),
      messages: [
        { role: 'user', content: userText },
        { role: 'system', content: `Context from internal tasklist:\n\n${context}` },
      ],
    })

    return result.toAIStreamResponse()
  } catch (err: any) {
    console.error('[chat] Unhandled error:', err)
    return fail(500, 'Server error: ' + (err?.message ?? String(err)))
  }
}
