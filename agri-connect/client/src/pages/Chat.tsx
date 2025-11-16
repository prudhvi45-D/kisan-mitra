import React, { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useLocation } from 'react-router-dom'
import API from '../api'
import { useTranslation } from 'react-i18next'

interface Msg { _id?: string; from: string; to: string; body?: string; image?: string; createdAt?: string }

const Chat: React.FC = () => {
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

  const connect = () => {
    if (sockRef.current) return
    const token = localStorage.getItem('access')
    const s = io('http://127.0.0.1:4000', { auth: { token } })
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.on('message:new', (m: Msg) => setMessages(prev => [...prev, m]))
    sockRef.current = s
  }

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

  useEffect(() => { connect() }, [])
  useEffect(() => {
    const sp = new URLSearchParams(loc.search)
    const p = sp.get('peer')
    const n = sp.get('name') || ''
    if (p) setPeer(p)
    if (n) setPeerName(n)
  }, [loc.search])
  useEffect(() => { if (peer) loadHistory() }, [peer])
  useEffect(() => {
    const fetchName = async () => {
      if (peer && (!peerName || !peerRole || peerOnline === undefined)) {
        try {
          const { data } = await API.get(`/users/${peer}`)
          if (data?.name) setPeerName(data.name)
          if (data?.role) setPeerRole(data.role)
          if (typeof data?.online === 'boolean') setPeerOnline(!!data.online)
        } catch {}
      }
    }
    fetchName()
  }, [peer, peerName, peerRole, peerOnline])

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-3">{(peerName || peer) ? <span className="font-bold">{peerName || t('app.user')}</span> : <>{t('app.chat')}</>}</h2>
      <div className="flex gap-2 mb-3 items-center">
        <span className={`text-sm inline-flex items-center gap-1 ${peerOnline? 'text-emerald-600':'text-gray-500'}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${peerOnline? 'bg-emerald-500':'bg-gray-400'}`}></span>
          {peerOnline ? (t('app.online') || 'Online') : (t('app.offline') || 'Offline')}
        </span>
        <button disabled={!peer} className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50" onClick={async ()=>{ if (!peer) return; await API.delete(`/messages/${peer}`); setMessages([]) }}>{t('app.clear')}</button>
      </div>
      <div className="border rounded h-80 overflow-auto p-2 space-y-2 bg-white">
        {messages.map((m, idx) => {
          const fromPeer = peer && m.from === peer
          const label = fromPeer ? (peerName || t('app.user')) : (t('app.you') || 'You')
          return (
            <div key={m._id || idx} className="text-sm space-y-1">
              <div className="text-gray-500">{label}:</div>
              {m.body && <div>{m.body}</div>}
              {m.image && (
                <div className="space-y-1">
                  <img src={`http://127.0.0.1:4000${m.image}`} className="max-w-full rounded border" />
                  <div>
                    <a
                      href={`http://127.0.0.1:4000${m.image}`}
                      download
                      className="inline-block text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    >{t('common.download')}</a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="border rounded px-2 py-1 flex-1" placeholder={t('app.typeMessage') || 'Type a message'} value={text} onChange={e=>setText(e.target.value)} />
        {/* hidden file input for media upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e)=>{
            const f = e.target.files?.[0]; if (!f || !peer) return;
            const fd = new FormData(); fd.append('image', f);
            try { await API.post(`/messages/${peer}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' }}); }
            finally { if (fileRef.current) fileRef.current.value=''; }
          }}
        />
        <button
          type="button"
          disabled={!peer}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          onClick={()=> fileRef.current?.click()}
          title={t('app.sendImage') || 'Send Image'}
        >
          📎
        </button>
        <button className="px-3 py-1 rounded bg-primary-600 text-white" onClick={send}>{t('app.send')}</button>
      </div>
    </div>
  )
}

export default Chat
