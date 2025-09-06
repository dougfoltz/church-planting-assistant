import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'CHURCH.tech AI – Church Planting Coach',
  description: 'Chat with the Church Startup Tasklist',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-white">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-brand" />
                <span className="font-semibold tracking-tight">CHURCH.tech AI</span>
              </div>
              <a href="https://church.tech" className="text-sm text-gray-500 hover:text-gray-700">church.tech</a>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-6">
              {children}
            </div>
          </main>
          <footer className="border-t bg-white">
            <div className="mx-auto max-w-5xl px-4 py-3 text-xs text-gray-500">
              Coaching help drawn from the Church Startup Tasklist
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
