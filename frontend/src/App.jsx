import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import useChat from './hooks/useChat'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    rooms, activeRoom, activeRoomId, messages, streamingMsg, isStreaming,
    loadRooms, selectRoom,
    handleCreateRoom, handleDeleteRoom, handleRenameRoom,
    sendMessage, stopStreaming,
  } = useChat()

  useEffect(() => {
    loadRooms().then(data => {
      if (data.length > 0) selectRoom(data[0].id)
    })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-primary">

      {/* Mobile hamburger — only visible on small screens */}
      <button
        onClick={() => setSidebarOpen(v => !v)}
        className="md:hidden fixed top-3 left-3 z-[110] p-2 rounded-lg bg-surface border border-border text-primary"
      >
        <Menu size={17} />
      </button>

      <Sidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={selectRoom}
        onCreateRoom={handleCreateRoom}
        onDeleteRoom={handleDeleteRoom}
        onRenameRoom={handleRenameRoom}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatWindow
        room={activeRoom}
        messages={messages}
        streamingMsg={streamingMsg}
        isStreaming={isStreaming}
        onSend={sendMessage}
        onStop={stopStreaming}
      />
    </div>
  )
}