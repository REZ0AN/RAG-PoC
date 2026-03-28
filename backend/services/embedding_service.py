from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from config import settings
import logging

logger = logging.getLogger(__name__)

_embeddings = None
_vectorstore = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings

def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            collection_name="rag_documents",
            embedding_function=get_embeddings(),
            persist_directory=settings.CHROMA_DB_PATH,
        )
    return _vectorstore

def get_retriever():
    return get_vectorstore().as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.TOP_K_RESULTS},
    )