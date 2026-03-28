from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from services.embedding_service import get_vectorstore
from config import settings
import logging

logger = logging.getLogger(__name__)

SUPPORTED = {".pdf", ".docx", ".txt"}

def get_loader(file_path: str):
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path)
    elif ext == ".docx":
        return Docx2txtLoader(file_path)
    elif ext == ".txt":
        return TextLoader(file_path, encoding="utf-8")
    raise ValueError(f"Unsupported file type: {ext}")

async def process_document(file_path: str, filename: str) -> int:
    loader = get_loader(file_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(docs)

    # Tag each chunk with source metadata
    for i, chunk in enumerate(chunks):
        chunk.metadata["source_file"] = filename
        chunk.metadata["chunk_index"] = i

    vs = get_vectorstore()
    vs.add_documents(chunks)
    logger.info(f"Indexed {len(chunks)} chunks from '{filename}'")
    return len(chunks)