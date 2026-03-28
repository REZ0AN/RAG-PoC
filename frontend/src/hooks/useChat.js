import { useState, useCallback, useRef } from 'react'
import { getRooms, createRoom, renameRoom, deleteRoom, getMessages, streamChat } from '../api/client'

export default function useChat() {
  const [rooms, setRooms] = useState([])
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [streamingMsg, setStreamingMsg] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(false)

  const loadRooms = useCallback(async () => {
    const data = await getRooms()
    setRooms(data)
    return data
  }, [])

  const selectRoom = useCallback(async (id) => {
    setActiveRoomId(id)
    setStreamingMsg(null)
    setIsStreaming(false)
    const msgs = await getMessages(id)
    setMessages(msgs)
  }, [])

  const handleCreateRoom = useCallback(async () => {
    const room = await createRoom('New Chat')
    setRooms(prev => [room, ...prev])
    await selectRoom(room.id)
    return room
  }, [selectRoom])

  const handleDeleteRoom = useCallback(async (id) => {
    await deleteRoom(id)
    setRooms(prev => prev.filter(r => r.id !== id))
    if (activeRoomId === id) {
      setActiveRoomId(null)
      setMessages([])
    }
  }, [activeRoomId])

  const handleRenameRoom = useCallback(async (id, name) => {
    await renameRoom(id, name)
    setRooms(prev => prev.map(r => r.id === id ? { ...r, name } : r))
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!activeRoomId || isStreaming) return
    abortRef.current = false

    // Optimistic user message
    const tempId = `temp-${Date.now()}`
    const userMsg = { id: tempId, role: 'user', content: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setStreamingMsg('')
    setIsStreaming(true)

    streamChat(
      activeRoomId,
      text,
      // onChunk
      (chunk) => {
        if (abortRef.current) return
        setStreamingMsg(prev => (prev ?? '') + chunk)
      },
      // onDone
      (roomName) => {
        if (abortRef.current) return
        setIsStreaming(false)
        // Re-fetch messages to get the persisted assistant message with real ID
        getMessages(activeRoomId).then(msgs => {
          setMessages(msgs)
          setStreamingMsg(null)
        })
        // Update room name if auto-named
        if (roomName) {
          setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, name: roomName, updated_at: new Date().toISOString() } : r))
        }
      },
      // onError
      (err) => {
        console.error('Stream error:', err)
        setIsStreaming(false)
        setStreamingMsg(null)
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: `⚠️ Error: ${err}`, created_at: new Date().toISOString() }])
      }
    )
  }, [activeRoomId, isStreaming])

  const stopStreaming = useCallback(() => {
    abortRef.current = true
    setIsStreaming(false)
    if (streamingMsg) {
      setMessages(prev => [...prev, { id: `stopped-${Date.now()}`, role: 'assistant', content: streamingMsg + ' _(stopped)_', created_at: new Date().toISOString() }])
    }
    setStreamingMsg(null)
  }, [streamingMsg])

  const activeRoom = rooms.find(r => r.id === activeRoomId) ?? null

  return {
    rooms, activeRoom, activeRoomId, messages, streamingMsg, isStreaming,
    loadRooms, selectRoom,
    handleCreateRoom, handleDeleteRoom, handleRenameRoom,
    sendMessage, stopStreaming,
  }
}