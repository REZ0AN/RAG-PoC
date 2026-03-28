# RAG Assistant

A self-hosted document chat system. Upload your PDFs, DOCX, and TXT files — then ask questions about them in a clean chat interface. Answers are streamed in real time using Google Gemini and grounded in your documents via semantic search.

---

## Stack

| Layer | Technology |
|---|---|
| LLM | Google Gemini 2.5 Flash |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` |
| Vector Store | ChromaDB (local, persistent) |
| Orchestration | LangChain |
| Backend | FastAPI + SQLite |
| Frontend | React + Vite + Tailwind CSS |
| Serving | Nginx (reverse proxy + static files) |
| Tunnel | Cloudflare Zero Trust (optional) |

---

## Features

- **RAG pipeline** — documents are chunked, embedded, and stored locally; top-5 relevant chunks are injected into every prompt
- **Streaming responses** — answers stream token by token via Server-Sent Events
- **Multiple chat rooms** — persistent history, grouped by Today / Yesterday / Past 7 days
- **Document manager** — drag & drop upload, chunk count display, delete
- **Supported formats** — PDF, DOCX, TXT
- **No auth required** — single-user, local deployment

---

## Project Structure

```
rag-system/
├── docker-compose.yml
├── .env                        # CLOUDFLARE_TUNNEL_TOKEN
├── backend/
├──── data/                       # all persistent data (git-ignored)
│   │ ├── uploads/                # raw uploaded files
│   │ ├── chroma_db/              # vector embeddings
│   │ └── db/                     # SQLite chat history
│   ├── main.py                 # FastAPI app
│   ├── config.py               # settings via pydantic-settings
│   ├── database.py             # async SQLite engine
│   ├── models.py               # ChatRoom, Message, Document ORM
│   ├── routers/
│   │   ├── rooms.py            # chat room CRUD + message history
│   │   ├── chat.py             # SSE streaming endpoint
│   │   └── documents.py        # upload / list / delete
│   ├── services/
│   │   ├── rag_service.py      # Gemini + retrieval + streaming chain
│   │   ├── embedding_service.py# HuggingFace embeddings + ChromaDB
│   │   └── document_processor.py # file parsing + chunking + indexing
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env                    # GEMINI_API_KEY
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx     # chat list, date groups, rename/delete
    │   │   ├── ChatWindow.jsx  # message thread + hero empty state
    │   │   ├── MessageBubble.jsx # markdown, code blocks, copy button
    │   │   ├── ChatInput.jsx   # auto-resize textarea, send/stop
    │   │   └── FileUpload.jsx  # drag & drop, progress, doc list
    │   ├── hooks/useChat.js    # all chat state logic
    │   └── api/client.js       # axios + SSE fetch calls
    ├── nginx.conf
    └── Dockerfile
```

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone & configure

```bash
git clone <your-repo-url> rag-system
cd rag-system
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Create data directories

```bash
mkdir -p ./backend/data/uploads ./backend/data/chroma_db ./backend/data/db
```

### 3. Build & run

```bash
docker compose up --build -d
```

Open **http://localhost** — the app is ready.

### 4. First use

1. Click **Documents** in the sidebar footer
2. Drag & drop your PDF / DOCX / TXT files
3. Wait for the chunk count to appear — indexing is done
4. Click **New chat** and start asking questions

---

## Local Development (without Docker)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, proxies `/api` → `http://localhost:8000`.

---

## Expose Publicly via Cloudflare Tunnel

1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Networks → Tunnels → Create a tunnel**
2. Name it, copy the token
3. Add a public hostname: `rag.yourdomain.com` → `http://frontend:80`
4. Add the token to the root `.env`:

```env
CLOUDFLARE_TUNNEL_TOKEN=your_token_here
```

5. Redeploy:

```bash
docker compose up -d
```

Your app is now live at `https://rag.yourdomain.com` — no port forwarding needed.

> **Tip:** Lock it down in Cloudflare Access → Applications → require email OTP or Google login before anyone reaches the app.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/rooms/` | List all chat rooms |
| `POST` | `/rooms/` | Create a new room |
| `PATCH` | `/rooms/{id}` | Rename a room |
| `DELETE` | `/rooms/{id}` | Delete a room |
| `GET` | `/rooms/{id}/messages` | Get message history |
| `POST` | `/chat/stream` | Send message, stream response (SSE) |
| `GET` | `/documents/` | List indexed documents |
| `POST` | `/documents/upload` | Upload & index a document |
| `DELETE` | `/documents/{id}` | Remove a document record |
| `GET` | `/health` | Health check |

---

## Configuration

All settings are in `backend/config.py` and read from `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Google AI Studio key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | HuggingFace sentence transformer |
| `CHUNK_SIZE` | `1000` | Characters per document chunk |
| `CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `TOP_K_RESULTS` | `5` | Chunks retrieved per query |
| `CHROMA_DB_PATH` | `./chroma_db` | Vector store location |
| `UPLOAD_DIR` | `./uploads` | Uploaded files location |

---

## How RAG Works Here

```
User question
     │
     ▼
Embed question (all-MiniLM-L6-v2)
     │
     ▼
ChromaDB similarity search → top 5 chunks
     │
     ▼
Build prompt:  [system: context] + [chat history] + [user question]
     │
     ▼
Gemini 2.5 Flash → streamed tokens
     │
     ▼
SSE → React UI (token by token)
     │
     ▼
Full response saved to SQLite
```

---

## Data Persistence

All data lives in `./data/` on the host machine — safe across container restarts and rebuilds:

| Path | Contents |
|---|---|
| `./backend/data/uploads/` | Original uploaded files |
| `./backend/data/chroma_db/` | Vector embeddings (ChromaDB) |
| `./backend/data/db/rag.db` | Chat rooms & message history (SQLite) |

To fully reset: `rm -rf ./data && mkdir -p data/uploads data/chroma_db data/db`