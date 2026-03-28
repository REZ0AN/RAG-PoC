from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Document
from services.document_processor import process_document, SUPPORTED
from config import settings
from pathlib import Path
import shutil
import uuid

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Supported: {SUPPORTED}")

    # Save file
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = Path(settings.UPLOAD_DIR) / unique_name
    with file_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # Process & index
    chunk_count = await process_document(str(file_path), file.filename)

    # Record in DB
    doc = Document(
        filename=file.filename,
        file_type=ext,
        chunk_count=chunk_count,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "chunk_count": chunk_count,
        "uploaded_at": doc.uploaded_at.isoformat(),
    }

@router.get("/")
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.uploaded_at.desc()))
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "chunk_count": d.chunk_count,
            "uploaded_at": d.uploaded_at.isoformat(),
        }
        for d in docs
    ]

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()
    return {"deleted": True, "note": "Chunks remain in vector store until server restart or manual purge."}