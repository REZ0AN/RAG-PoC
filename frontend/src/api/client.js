import axios from 'axios'

const BASE = '/api'
const api = axios.create({ baseURL: BASE })

// Rooms
export const getRooms = () => api.get('/rooms/').then(r => r.data)
export const createRoom = (name = 'New Chat') => api.post('/rooms/', { name }).then(r => r.data)
export const renameRoom = (id, name) => api.patch(`/rooms/${id}`, { name }).then(r => r.data)
export const deleteRoom = (id) => api.delete(`/rooms/${id}`).then(r => r.data)
export const getMessages = (roomId) => api.get(`/rooms/${roomId}/messages`).then(r => r.data)

// Documents
export const getDocuments = () => api.get('/documents/').then(r => r.data)
export const deleteDocument = (id) => api.delete(`/documents/${id}`).then(r => r.data)
export const uploadDocument = (file, onProgress) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/documents/upload', fd, {
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data)
}

// Streaming chat
export const streamChat = (roomId, message, onChunk, onDone, onError) => {
  fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, message }),
  }).then(async res => {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))
          if (data.error) { onError?.(data.error); return }
          if (data.done) { onDone?.(data.room_name); return }
          if (data.chunk) onChunk(data.chunk)
      }
    }
  }).catch(e => onError?.(e.message))
}