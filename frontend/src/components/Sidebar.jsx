import { useState } from 'react'
import { Plus, MessageSquare, Trash2, Pencil, Check, X, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import FileUpload from './FileUpload'

function groupRooms(rooms) {
  const today     = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  const week      = new Date(today); week.setDate(today.getDate()-7)
  const g = { Today: [], Yesterday: [], 'Past 7 days': [], Older: [] }
  for (const r of rooms) {
    const d = new Date(r.updated_at)
    if (d >= today)          g['Today'].push(r)
    else if (d >= yesterday) g['Yesterday'].push(r)
    else if (d >= week)      g['Past 7 days'].push(r)
    else                     g['Older'].push(r)
  }
  return g
}

export default function Sidebar({ rooms, activeRoomId, onSelectRoom, onCreateRoom, onDeleteRoom, onRenameRoom, isOpen, onClose }) {
  const [editingId, setEditingId] = useState(null)
  const [editVal, setEditVal]     = useState('')
  const [showDocs, setShowDocs]   = useState(false)

  const startEdit  = (e, r) => { e.stopPropagation(); setEditingId(r.id); setEditVal(r.name) }
  const commitEdit = (e, id) => {
    e.stopPropagation()
    if (editVal.trim()) onRenameRoom(id, editVal.trim())
    setEditingId(null)
  }

  const grouped = groupRooms(rooms)

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[99]"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed md:static top-0 left-0 h-full z-[100]
        w-[240px] flex flex-col bg-sidebar border-r border-border
        transition-transform duration-250
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* New chat button */}
        <div className="p-3 pt-4 flex-shrink-0">
          <button
            onClick={() => { onCreateRoom(); onClose() }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-primary text-sm font-medium hover:bg-hover transition-colors"
          >
            <Plus size={15} strokeWidth={2.2} />
            New chat
          </button>
        </div>

        <div className="h-px bg-border mx-3 flex-shrink-0" />

        {/* Rooms */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {rooms.length === 0 && (
            <p className="text-muted text-xs text-center py-8">No chats yet</p>
          )}

          {Object.entries(grouped).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-2 pt-3 pb-1">
                  {label}
                </p>
                {items.map(room => (
                  <div
                    key={room.id}
                    onClick={() => { onSelectRoom(room.id); onClose() }}
                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors
                      ${room.id === activeRoomId
                        ? 'bg-active text-primary'
                        : 'text-sub hover:bg-hover hover:text-primary'
                      }`}
                  >
                    <MessageSquare size={13} className="flex-shrink-0 opacity-50" />

                    {editingId === room.id ? (
                      <>
                        <input
                          className="flex-1 min-w-0 bg-surface border border-accent rounded px-2 py-0.5 text-primary text-xs outline-none"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(e, room.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <button onClick={e => commitEdit(e, room.id)} className="p-0.5 text-muted hover:text-primary">
                          <Check size={12} color="#10a37f" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setEditingId(null) }} className="p-0.5 text-muted hover:text-primary">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 min-w-0 truncate">{room.name}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity">
                          <button onClick={e => startEdit(e, room)} className="p-1 rounded text-muted hover:text-primary hover:bg-active">
                            <Pencil size={11} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); onDeleteRoom(room.id) }} className="p-1 rounded text-muted hover:text-red-400 hover:bg-active">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer — Documents */}
        <div className="border-t border-border p-2 flex-shrink-0">
          <button
            onClick={() => setShowDocs(v => !v)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sub text-sm hover:bg-hover hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText size={13} /> Documents
            </span>
            {showDocs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showDocs && <FileUpload />}
        </div>
      </aside>
    </>
  )
}