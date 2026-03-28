import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { getDocuments, uploadDocument, deleteDocument } from '../api/client'

export default function FileUpload() {
  const [docs,      setDocs]      = useState([])
  const [drag,      setDrag]      = useState(false)
  const [uploading, setUploading] = useState(null)
  const [toast,     setToast]     = useState(null)
  const inputRef = useRef()
  const loadDocs = () => getDocuments().then(setDocs).catch(() => {})

  useEffect(() => { loadDocs() }, [])


  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFiles = async (files) => {
    for (const file of files) {
      setUploading({ name: file.name, progress: 0 })
      try {
        await uploadDocument(file, p => setUploading({ name: file.name, progress: p }))
        showToast(`"${file.name}" indexed!`)
        await loadDocs()
      } catch (e) {
        showToast(e.response?.data?.detail || 'Upload failed', false)
      }
    }
    setUploading(null)
  }

  return (
    <div className="mt-1 px-1">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragEnter={() => setDrag(true)}
        onDragLeave={() => setDrag(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles([...e.dataTransfer.files]) }}
        className={`border border-dashed rounded-lg p-3 text-center cursor-pointer text-xs transition-all
          ${drag
            ? 'border-accent bg-accent/5 text-sub'
            : 'border-border text-muted hover:border-[#3a3a3a] hover:text-sub'
          }`}
      >
        <Upload size={14} className="mx-auto mb-1" />
        <p>Drop PDFs, DOCX, TXT</p>
        <p className="text-[10px] mt-0.5 text-muted">or click to browse</p>
        <input
          ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={e => { handleFiles([...e.target.files]); e.target.value = '' }}
        />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="mt-2 text-[11px] text-sub">
          <div className="flex items-center gap-1.5">
            <Loader size={11} className="animate-spin-s text-accent" />
            <span className="truncate">{uploading.name}</span>
          </div>
          <div className="h-0.5 bg-border rounded mt-1.5 overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${uploading.progress}%` }} />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${toast.ok ? 'text-accent' : 'text-red-400'}`}>
          {toast.ok ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
          {toast.msg}
        </div>
      )}

      {/* Doc list */}
      <div className="mt-2 max-h-36 overflow-y-auto flex flex-col gap-1">
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-1.5 px-2 py-1.5 bg-surface rounded-md text-[11px]">
            <FileText size={11} className="text-accent flex-shrink-0" />
            <span className="flex-1 min-w-0 truncate text-sub" title={d.filename}>{d.filename}</span>
            <span className="bg-active text-muted rounded px-1.5 py-0.5 text-[10px] flex-shrink-0">{d.chunk_count}c</span>
            <button
              onClick={() => deleteDocument(d.id).then(loadDocs)}
              className="p-0.5 text-muted hover:text-red-400 flex-shrink-0 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}