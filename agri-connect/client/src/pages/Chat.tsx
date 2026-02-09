import React, { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useLocation } from 'react-router-dom'
import API from '../api'
import { useTranslation } from 'react-i18next'
import chatBg from '../assets/chat-bg.svg'

interface Msg { _id?: string; from: string; to: string; body?: string; image?: string; createdAt?: string }

const Chat: React.FC = () => {
  const [myId, setMyId] = useState<string>('')
  const [peer, setPeer] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const sockRef = useRef<Socket | null>(null)
  const loc = useLocation()
  const [peerName, setPeerName] = useState('')
  const [peerRole, setPeerRole] = useState<string>('')
  const [peerOnline, setPeerOnline] = useState<boolean>(false)
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Identify myself
  useEffect(() => {
    try {
      const token = localStorage.getItem('access')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.id) setMyId(payload.id)
      }
    } catch { }
  }, [])

  // Socket connection
  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) return

    // Cleanup previous socket if any (strict mode safety)
    if (sockRef.current) sockRef.current.disconnect()

    const s = io('http://127.0.0.1:4000', { auth: { token } })
    sockRef.current = s

    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.on('message:new', (m: Msg) => {
      setMessages(prev => {
        if (prev.some(existing => existing._id === m._id && existing._id)) return prev
        return [...prev, m]
      })
    })

    return () => {
      s.disconnect()
      sockRef.current = null
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    if (!peer) return
    const { data } = await API.get(`/messages/${peer}`)
    setMessages(data)
  }

  const send = () => {
    if (!sockRef.current || !peer || !text) return
    sockRef.current.emit('message:send', { to: peer, body: text })
    setText('')
  }

  // Handle URL params
  useEffect(() => {
    const sp = new URLSearchParams(loc.search)
    const p = sp.get('peer')
    const n = sp.get('name') || ''
    if (p) setPeer(p)
    if (n) setPeerName(n)
  }, [loc.search])

  // Load history when peer changes
  useEffect(() => { if (peer) loadHistory() }, [peer])

  // Fetch peer details
  useEffect(() => {
    const fetchName = async () => {
      if (peer && (!peerName || !peerRole || peerOnline === undefined)) {
        try {
          const { data } = await API.get(`/users/${peer}`)
          if (data?.name) setPeerName(data.name)
          if (data?.role) setPeerRole(data.role)
          if (typeof data?.online === 'boolean') setPeerOnline(!!data.online)
        } catch { }
      }
    }
    fetchName()
  }, [peer, peerName, peerRole, peerOnline])

  return (
    <div
      className="fixed inset-0 pt-16 bg-green-50 flex justify-center"
      style={{ backgroundImage: `url(${chatBg})`, backgroundSize: '120px 120px', backgroundBlendMode: 'overlay' }}
    >
      <div className="w-full max-w-4xl h-[calc(100vh-5rem)] p-4 sm:p-6 flex flex-col">

        {/* Main Glass Container */}
        <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl overflow-hidden relative">

          {/* Glass Header */}
          <div className="flex-none p-4 bg-white/60 backdrop-blur-md border-b border-white/50 flex items-center justify-between z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${peerOnline ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gray-400'}`}>
                {(peerName?.[0] || '?').toUpperCase()}
                {peerOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></span>}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  {(peerName || peer) ? (peerName || t('app.user')) : t('app.chat')}
                </h2>
                <div className={`text-xs font-medium flex items-center gap-1.5 ${peerOnline ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {peerOnline ? (t('app.online') || 'Online') : (t('app.offline') || 'Offline')}
                </div>
              </div>
            </div>

            <button
              disabled={!peer}
              className="group p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30"
              onClick={async () => { if (!peer) return; if (window.confirm(t('common.confirmDelete') || 'Clear chat history?')) { await API.delete(`/messages/${peer}`); setMessages([]) } }}
              title={t('app.clear')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent">
            {(!peer) && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <div className="text-6xl mb-4">💬</div>
                <p>Select a conversation to start chatting</p>
              </div>
            )}

            {myId && peer && myId === peer && (
              <div className="mx-auto max-w-sm p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-xl text-center shadow-sm">
                ⚠️ Chatting with yourself. Use another browser/account to test real-time.
              </div>
            )}

            {messages.map((m, idx) => {
              const fromId = typeof m.from === 'object' ? (m.from as any)._id : m.from
              const isMe = myId && String(fromId) === String(myId)
              const showTime = true

              return (
                <div key={m._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] relative group ${isMe ? 'items-end' : 'items-start'
                      }`}
                  >
                    <div
                      className={`px-5 py-3 shadow-sm text-sm break-words relative transition-all duration-200 ${isMe
                          ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl rounded-tr-sm shadow-green-200 hover:shadow-green-300'
                          : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-white/60 rounded-2xl rounded-tl-sm hover:shadow-md hover:bg-white/95'
                        }`}
                    >
                      {m.body && <div className="leading-relaxed whitespace-pre-wrap">{m.body}</div>}

                      {m.image && (
                        <div className="space-y-2 mt-2">
                          <img src={`http://127.0.0.1:4000${m.image}`} className="rounded-lg max-w-full border border-white/20 shadow-sm" alt="attachment" />
                          <a
                            href={`http://127.0.0.1:4000${m.image}`}
                            download
                            className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${!isMe ? 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600' : 'bg-black/10 hover:bg-black/20 text-white'}`}
                          >
                            <span>⬇</span> {t('common.download')}
                          </a>
                        </div>
                      )}

                      <div className={`text-[10px] mt-1.5 font-medium text-right opacity-70 ${isMe ? 'text-green-50' : 'text-gray-400'}`}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="flex-none p-4 bg-white/60 backdrop-blur-md border-t border-white/50 z-10">
            <div className="flex items-end gap-2 bg-white/70 border border-white/60 p-1.5 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-green-400/50 focus-within:bg-white transition-all">
              <button
                type="button"
                disabled={!peer}
                className="p-3 rounded-xl text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50"
                onClick={() => fileRef.current?.click()}
                title={t('app.sendImage') || 'Send Image'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>

              <textarea
                className="flex-1 bg-transparent border-0 px-2 py-3 text-sm focus:ring-0 resize-none max-h-32 min-h-[44px] placeholder:text-gray-400"
                placeholder={t('app.typeMessage') || 'Type your message...'}
                rows={1}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />

              <button
                className={`p-3 rounded-xl transition-all shadow-md ${text.trim() ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-200 hover:shadow-green-300 hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                onClick={send}
                disabled={!text.trim()}
              >
                <svg className="w-5 h-5 translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            {/* Hidden File Input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f || !peer) return;
                const fd = new FormData(); fd.append('image', f);
                try { await API.post(`/messages/${peer}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
                finally { if (fileRef.current) fileRef.current.value = ''; }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
