// app/api/chat/route.ts
import { NextRequest } from 'next/server'
import { streamText, embedMany } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { loadIndex, retrieve } from '@/lib/rag'
import { systemPrompt } from '@/lib/prompt'

export const runtime = 'edge'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const userMsg = messages?.filter((m: any) => m.role === 'user').pop()
    const userText: string = userMsg?.content ?? ''

    // Load the local index
    const index = await loadIndex()

    // Create an embedding for the query
    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: [userText],
    })
    const queryVec = embeddings[0].embedding as number[]

    // Retrieve top-K context chunks
    const topK = Number(process.env.RAG_TOP_K ?? 6)
    const hits = retrieve(index, queryVec, topK)
    const context = hits.map(h => h.text).join('\n\n---\n\n')

    // Stream a chat response
    const result = await streamText({
      model: openai.chat(process.env.OPENAI_CHAT_MODEL || 'gpt-5'),
      temperature: 0.3,
      system: systemPrompt(),
      messages: [
        { role: 'user', content: userText },
        { role: 'system', content: `Context from internal tasklist:\n\n${context}` },
      ],
    })

    return result.toAIStreamResponse()
  } catch (err: any) {
    return new Response('Error: ' + err.message, { status: 500 })
  }
}
