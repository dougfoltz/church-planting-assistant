import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { cosineSimilarity, loadIndex, retrieve } from '@/lib/rag'
import { systemPrompt } from '@/lib/prompt'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const userMsg = messages?.filter((m: any) => m.role === 'user').pop()
    const userText: string = userMsg?.content || ''

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const index = await loadIndex()

    // Embed the query
    const embRes = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: userText
    })
    const queryVec = embRes.data[0].embedding

    // Retrieve context
    const topK = Number(process.env.RAG_TOP_K ?? 6)
    const hits = retrieve(index, queryVec, topK)

    const context = hits.map(h => h.text).join('\n\n---\n\n')

    const sys = systemPrompt()

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userText },
        { role: 'system', content: `Context from internal tasklist:\n\n${context}` }
      ],
      stream: true
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        for await (const part of completion) {
          const delta = part.choices[0]?.delta?.content || ''
          if (delta) controller.enqueue(encoder.encode(delta))
        }
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  } catch (err: any) {
    return new Response('Error: ' + err.message, { status: 500 })
  }
}
