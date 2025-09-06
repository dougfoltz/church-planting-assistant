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

async function main() {
  const src = path.join(process.cwd(), 'data', 'checklist.txt')
  const out = path.join(process.cwd(), 'data', 'index.json')
  const text = await fs.readFile(src, 'utf-8')

  const chunks = chunkText(text)
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const embeddings = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks
  })

  const index = {
    chunks: chunks.map((t, i) => ({
      id: `chk_${i}`,
      text: t,
      embedding: embeddings.data[i].embedding
    }))
  }

  await fs.writeFile(out, JSON.stringify(index, null, 2), 'utf-8')
  console.log(`Index written to ${out} with ${chunks.length} chunks`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
