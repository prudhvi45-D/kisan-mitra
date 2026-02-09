import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import API from './api'

type InMsg = { _id?: string; from: string; to: string; body: string; createdAt?: string }

type Ctx = {
  connected: boolean
  lastMsg?: InMsg & { peer?: string }
  unreadCount: number
  clearLast: () => void
  resetUnread: () => void
}

const SocketCtx = createContext<Ctx>({ connected: false, clearLast: () => {}, unreadCount: 0, resetUnread: () => {} })

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const [lastMsg, setLastMsg] = useState<(InMsg & { peer?: string }) | undefined>(undefined)
  const [unreadCount, setUnreadCount] = useState(0)
  const sockRef = useRef<Socket | null>(null)
  const [myId, setMyId] = useState<string | undefined>(undefined)

  const connect = () => {
    if (sockRef.current) return
    const token = localStorage.getItem('access')
    if (!token) return
    const s = io('http://127.0.0.1:4000', { auth: { token } })
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.on('message:new', (m: InMsg) => {
      const peer = myId ? (m.from === myId ? m.to : m.from) : undefined
      setLastMsg({ ...m, peer })
      setUnreadCount((c) => c + 1)
    })
    sockRef.current = s
  }

  const disconnect = () => {
    if (sockRef.current) {
      sockRef.current.disconnect()
      sockRef.current = null
      setConnected(false)
    }
  }

  useEffect(() => {
    // Connect if a token already exists (page refresh case)
    connect()
    // fetch my id for peer resolution
    const fetchMe = async () => {
      const token = localStorage.getItem('access')
      if (!token) return
      try { const { data } = await API.get('/account/me'); if (data?._id) setMyId(data._id) } catch {}
    }
    fetchMe()
    const onLogin = () => { disconnect(); connect() }
    const onLogout = () => { disconnect(); setLastMsg(undefined); setUnreadCount(0) }
    window.addEventListener('auth:login', onLogin as EventListener)
    window.addEventListener('auth:logout', onLogout as EventListener)
    return () => {
      window.removeEventListener('auth:login', onLogin as EventListener)
      window.removeEventListener('auth:logout', onLogout as EventListener)
      disconnect()
    }
  }, [])

  const clearLast = () => setLastMsg(undefined)
  const resetUnread = () => setUnreadCount(0)

  return (
    <SocketCtx.Provider value={{ connected, lastMsg, unreadCount, clearLast, resetUnread }}>
      {children}
    </SocketCtx.Provider>
  )
}

export const useSocketCtx = () => useContext(SocketCtx)
