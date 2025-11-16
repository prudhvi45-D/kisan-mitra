import React, { useMemo, useRef, useState } from 'react'
import API from '../api'
import { useAuth } from '../auth'

 type Msg = { id: string; role: 'user'|'assistant'; text: string }

const AssistantWidget: React.FC<{ inline?: boolean }> = ({ inline }) => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const { role } = useAuth()
  const panelRef = useRef<HTMLDivElement|null>(null)
  const [listening, setListening] = useState(false)
  const recogRef = useRef<any>(null)

  const placeholder = useMemo(()=>{
    if (role === 'buyer') return 'Ask about finding listings, pricing, or contacting farmers...'
    if (role === 'farmer') return 'Ask about uploading listings, pricing tips, or marking sold...'
    if (role === 'admin') return 'Ask about market prices, dashboard, or moderation...'
    return 'How can I help?'
  }, [role])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    const u: Msg = { id: String(Date.now()), role: 'user', text }
    setMessages(prev => [...prev, u])
    setInput('')
    setBusy(true)
    try {
      const { data } = await API.post('/assistant/chat', { message: text, role })
      const a: Msg = { id: u.id + '-a', role: 'assistant', text: data?.reply || '...' }
      setMessages(prev => [...prev, a])
      setTimeout(()=>{
        panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    } catch (e: any) {
      const a: Msg = { id: u.id + '-e', role: 'assistant', text: e?.response?.data?.message || 'Sorry, something went wrong.' }
      setMessages(prev => [...prev, a])
    } finally {
      setBusy(false)
    }
  }

  const toggleListen = () => {
    if (listening) {
      try { recogRef.current?.stop() } catch {}
      setListening(false)
      return
    }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recog = new SR()
    recog.lang = 'en-US'
    recog.interimResults = false
    recog.maxAlternatives = 1
    recog.onresult = (ev: any) => {
      const transcript = ev.results?.[0]?.[0]?.transcript || ''
      if (transcript) setInput(prev => (prev ? prev + ' ' : '') + transcript)
    }
    recog.onend = () => setListening(false)
    recog.onerror = () => setListening(false)
    recogRef.current = recog
    setListening(true)
    try { recog.start() } catch { setListening(false) }
  }

  return (
    <div className={inline ? '' : 'fixed bottom-16 left-4 z-50'}>
      {/* Toggle button */}
      {!open && (
        <button
          className={`shadow-lg rounded-full bg-primary-600 hover:bg-primary-700 text-white w-10 h-10 flex items-center justify-center ${inline ? '' : 'text-xs'}`}
          onClick={()=>setOpen(true)}
          aria-label="Open Assistant"
          title="Assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
            <path d="M12 2a3 3 0 0 1 3 3h-2a1 1 0 1 0-2 0H9a3 3 0 0 1 3-3Zm7 8a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-12 8a2 2 0 1 1-2-2v2h2Zm14 0v-2a2 2 0 1 1-2 2h2Z"/>
            <circle cx="9" cy="11" r="1.2" />
            <circle cx="15" cy="11" r="1.2" />
            <path d="M9.5 14c.9.6 2 .9 2.5.9s1.6-.3 2.5-.9" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed bottom-28 left-4 w-72 sm:w-80 h-80 bg-white shadow-2xl rounded-lg border flex flex-col z-50">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">AI Assistant</div>
            <button className="text-xs text-gray-500 hover:text-gray-700" onClick={()=>setOpen(false)}>Close</button>
          </div>
          <div ref={panelRef} className="flex-1 overflow-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-xs text-gray-500">Hi! I can help with navigation, pricing tips, and using this app.</div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`text-sm leading-relaxed ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          <div className="p-2 border-t space-y-2">
            <input
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder={placeholder}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') send() }}
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                className={`rounded-full w-9 h-9 flex items-center justify-center ${listening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={toggleListen}
                aria-pressed={listening}
                title={listening ? 'Stop voice' : 'Start voice'}
              >🎤</button>
              <button
                className={`rounded px-3 py-2 text-sm text-white ${busy ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
                disabled={busy || !input.trim()}
                onClick={send}
              >{busy ? 'Thinking…' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssistantWidget
