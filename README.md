# CHURCH.tech AI – Church Planting Coach

A small Next.js app you can deploy on Vercel. It chats using OpenAI and retrieves context from your Church Startup Tasklist.

## What you get
- Simple chat UI with starter prompts
- Retrieval over your checklist using embeddings
- No external database. Chat history lives in the browser
- Export conversation to Markdown

## Quick start
1. Clone the repo and install:
```bash
pnpm i
# or
npm i
```

2. Add your key:
```
cp .env.example .env.local
# edit .env.local and set OPENAI_API_KEY
```

3. Build the index from your checklist:
```
npm run build-index
```

4. Run locally:
```
npm run dev
```

5. Deploy to Vercel:
- Push to GitHub
- Create a new Vercel project
- Add the env vars below

## Environment variables
```
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
RAG_TOP_K=6
```

## Replace the checklist
Put your content in `data/checklist.txt` and run `npm run build-index` again.

## Notes
- If you ever want server-side chat history, add Vercel Postgres or Redis later.
- Styling uses Tailwind with a green brand color to match your site.
