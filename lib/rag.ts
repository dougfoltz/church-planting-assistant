import path from 'path'
import fs from 'fs/promises'

export type Chunk = { id: string; text: string; embedding: number[] }
export type Index = { chunks: Chunk[] }

let cachedIndex: Index | null = null

export async function loadIndex(): Promise<Index> {
  if (cachedIndex) return cachedIndex
  const file = path.join(process.cwd(), 'data', 'index.json')
  const raw = await fs.readFile(file, 'utf-8')
  cachedIndex = JSON.parse(raw)
  return cachedIndex!
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8)
}

export function retrieve(index: Index, query: number[], k = 6) {
  const scored = index.chunks.map(ch => ({
    ...ch,
    score: cosineSimilarity(query, ch.embedding)
  }))
  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, k)
}
