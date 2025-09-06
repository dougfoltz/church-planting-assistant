// scripts/build-index.ts
import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'

function chunkText(text: string, maxChars = 1200, overlap = 150) {
  const parts: string[] = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length)
    const slice = text.slice(i, end)
    parts.push(slice.trim())
    i = end - overlap
    if (i < 0) i = 0
  }
  return parts.filter(p => p.length > 0)
}

async function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

async function embedInBatches(client: OpenAI, inputs: string[], batchSize = 64) {
  const all: number[][] = []
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize)
    let attempt = 0
    while (true) {
      try {
        const res = await client.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        })
        for (const item of res.data) {
          all.push(item.embedding as unknown as number[])
        }
        break
      } catch (err: any) {
        attempt++
        const wait = Math.min(2000 * attempt, 10000)
        console.error(`Embedding batch failed (attempt ${attempt}). Retrying in ${wait}ms. Error: ${err?.message || err}`)
        await sleep(wait)
        if (attempt >= 5) throw err
      }
    }
    // small pause to avoid rate limits
    await sleep(200)
  }
  return all
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const src = path.join(process.cwd(), 'data', 'checklist.txt')
  const out = path.join(process.cwd(), 'data', 'index.json')

  const text = await fs.readFile(src, 'utf-8')
  if (!text || text.trim().length === 0) {
    throw new Error('data/checklist.txt is empty')
  }

  const chunks = chunkText(text)
  console.log(`Chunking complete. ${chunks.length} chunks.`)

  const client = new OpenAI({ apiKey })
  const embeddings = await embedInBatches(client, chunks, 64)

  if (embeddings.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: got ${embeddings.length}, expected ${chunks.length}`)
  }

  const index = {
    chunks: chunks.map((t, i) => ({
      id: `chk_${i}`,
      text: t,
      embedding: embeddings[i],
    })),
  }

  await fs.writeFile(out, JSON.stringify(index, null, 2), 'utf-8')
  console.log(`Index written to ${out} with ${index.chunks.length} chunks`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
