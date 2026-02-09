import React, { useMemo, useRef, useState, useEffect } from 'react'
import API from '../api'
import { useAuth } from '../auth'

type Msg = { id: string; role: 'user' | 'assistant'; text: string }

const AssistantWidget: React.FC<{ inline?: boolean }> = ({ inline }) => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const { role } = useAuth()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [listening, setListening] = useState(false)
  const recogRef = useRef<any>(null)

  const placeholder = useMemo(() => {
    if (role === 'buyer') return 'Ask about prices, finding crops...'
    if (role === 'farmer') return 'Ask about market trends, uploading...'
    if (role === 'admin') return 'Ask about user stats, reports...'
    return 'How can I assist you today?'
  }, [role])

  useEffect(() => {
    if (open && messages.length === 0) {
      // Optional: Add a greeting if empty
    }
  }, [open, messages])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    const u: Msg = { id: String(Date.now()), role: 'user', text }
    setMessages(prev => [...prev, u])
    setInput('')
    setBusy(true)

    // Auto scroll
    setTimeout(() => scrollToBottom(), 50)

    try {
      const { data } = await API.post('/assistant/chat', { message: text, role })
      const a: Msg = { id: u.id + '-a', role: 'assistant', text: data?.reply || 'I am here to help.' }
      setMessages(prev => [...prev, a])
      setTimeout(() => scrollToBottom(), 50)
    } catch (e: any) {
      const a: Msg = { id: u.id + '-e', role: 'assistant', text: e?.response?.data?.message || 'Sorry, I encountered an error.' }
      setMessages(prev => [...prev, a])
      setTimeout(() => scrollToBottom(), 50)
    } finally {
      setBusy(false)
    }
  }

  const scrollToBottom = () => {
    panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight, behavior: 'smooth' })
  }

  const toggleListen = () => {
    if (listening) {
      try { recogRef.current?.stop() } catch { }
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
    <div className={inline ? 'w-full h-full' : 'fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4'}>
      {/* Chat Window */}
      {(open || inline) && (
        <div
          className={`${inline ? 'w-full h-full shadow-none' : 'w-80 sm:w-96 h-[32rem] shadow-2xl rounded-3xl mb-2'} 
            bg-white/70 backdrop-blur-xl border border-white/60 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 origin-bottom-right`}
        >
          {/* Header */}
          <div className="flex-none p-4 bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-md text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">AI Assistant</h3>
                <div className="text-[10px] text-green-100 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></span>
                  Online
                </div>
              </div>
            </div>
            {!inline && (
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Messages */}
          <div ref={panelRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 opacity-80">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 shadow-inner">
                  <span className="text-3xl">👋</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Hello! I'm Kisan-Mitra AI.</p>
                <p className="text-xs mt-1">Ask me anything about crops, prices, or how to use the app.</p>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user'
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-300`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative ${isUser
                        ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-br-none shadow-green-200'
                        : 'bg-white/80 backdrop-blur-sm border border-white/60 text-gray-800 rounded-bl-none shadow-sm'
                      }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    <div className={`text-[9px] mt-1 font-medium text-right opacity-70 ${isUser ? 'text-green-50' : 'text-gray-400'}`}>
                      {isUser ? 'You' : 'AI'}
                    </div>
                  </div>
                </div>
              )
            })}

            {busy && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-none p-3 bg-white/60 backdrop-blur-md border-t border-white/50">
            <div className="relative flex items-center gap-2">
              <input
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/70 border border-white/50 text-sm focus:ring-2 focus:ring-green-400/50 focus:bg-white transition-all shadow-inner placeholder:text-gray-400"
                placeholder={placeholder}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send() }}
              />

              <button
                type="button"
                onClick={toggleListen}
                className={`absolute right-2 p-1.5 rounded-lg transition-colors ${listening ? 'text-red-500 bg-red-100 animate-pulse' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                title="Voice Input"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            </div>

            <div className="flex justify-between items-center mt-2 px-1">
              <div className="text-[10px] text-gray-400 font-medium">✨ Powered by Gemini</div>
              <button
                onClick={send}
                disabled={!input.trim() || busy}
                className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-green-200 shadow-md hover:bg-green-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!inline && !open && (
        <button
          onClick={() => setOpen(true)}
          className="group relative flex items-center justify-center"
        >
          {/* Ripple effects */}
          <span className="absolute inset-0 rounded-full bg-green-400 opacity-20 group-hover:opacity-40 animate-ping duration-[2000ms]"></span>
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-10 group-hover:opacity-20 animate-[ping_3s_infinite_500ms]"></span>

          <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-[0_8px_30px_rgb(22,163,74,0.4)] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-active:scale-95 z-50 overflow-hidden border border-white/20">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <svg className="w-7 h-7 drop-shadow-md relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>

            {/* Online dot */}
            <span className="absolute top-3 right-3 w-2 h-2 bg-green-300 border border-emerald-600 rounded-full shadow-[0_0_8px_rgba(134,239,172,0.8)]"></span>
          </div>
        </button>
      )}
    </div>
  )
}

export default AssistantWidget
