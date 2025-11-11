import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../features/auth/AuthContext'

export default function GroupChat() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [group, setGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const listRef = useRef(null)

  // Cargar datos del grupo
  useEffect(() => {
    let active = true
    setError('')
    setLoading(true)
    api.get(`/match/group/${groupId}`)
      .then(({ data }) => {
        if (!active) return
        setGroup(data)
      })
      .catch(() => {
        if (!active) return
        setError('No se pudo cargar el grupo')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [groupId])

  // Traer mensajes periódicamente
  useEffect(() => {
    let canceled = false
    const fetchMessages = () => {
      api.get(`/chat/${groupId}/messages`, { params: { limit: 200 } })
        .then(({ data }) => {
          if (canceled) return
          setMessages(data.messages || [])
        })
        .catch(() => {})
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => {
      canceled = true
      clearInterval(interval)
    }
  }, [groupId])

  // Autoscroll al último mensaje
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = listRef.current
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    })
  }, [messages.length])

  const handleSend = async (event) => {
    event.preventDefault()
    const body = input.trim()
    if (!body) return
    setSending(true)
    try {
      const { data } = await api.post(`/chat/${groupId}/messages`, { body })
      if (data?.message) {
        setMessages((prev) => [...prev, data.message])
      }
      setInput('')
      setError('')
      // Scroll inmediato después de enviar
      requestAnimationFrame(() => {
        const el = listRef.current
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const myId = user?.id && String(user.id)
  const memberNames = group?.members?.map((m) => m.name).join(' - ')

  return (
    // Importante: este componente asume que su padre (AppShell) en la ruta /chat usa: <main className="h-dvh overflow-hidden">
    <div className="h-full bg-neutral-200 flex justify-center px-0 sm:px-4">
      <div className="flex flex-col w-full max-w-full sm:max-w-screen-sm h-full bg-neutral-100 shadow sm:rounded-2xl sm:overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-3 p-4 bg-white shadow shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-2xl leading-none"
            aria-label="Volver"
            title="Volver"
          >
            ←
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {group?.destination?.address || 'Chat del grupo'}
            </h1>
            {memberNames && (
              <p className="text-xs text-gray-500 truncate">{memberNames}</p>
            )}
          </div>
        </header>

        {error && (
          <p className="text-sm text-red-600 px-4 pt-2 shrink-0">{error}</p>
        )}

        {/* Lista de mensajes: ÚNICO scroll vertical */}
        <main
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-neutral-100"
        >
          {loading && <p className="text-sm text-gray-500">Cargando...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-gray-400">Aún no hay mensajes.</p>
          )}

          {messages.map((msg) => {
            const isMine = myId && String(msg.sender) === myId
            return (
              <div
                key={msg.id ?? `${msg.sender}-${msg.createdAt}`}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 text-sm break-words ${
                    isMine ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-900'
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-wide mb-1 opacity-70">
                    {isMine ? 'Tú' : msg.senderName || 'Compañero'}
                  </p>
                  <p className="whitespace-pre-line break-words">{msg.body}</p>
                  <p className="text-[10px] opacity-70 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
        </main>

        {/* Input */}
        <footer className="bg-white border-t p-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
              autoComplete="off"
              inputMode="text"
              aria-label="Escribe un mensaje"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              aria-disabled={sending || !input.trim()}
            >
              Enviar
            </button>
          </form>
        </footer>
      </div>
    </div>
  )
}
