from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from services.embedding_service import get_retriever
from config import settings
from typing import AsyncIterator
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful AI assistant with access to a document knowledge base.
Use the retrieved context below to answer the user's question accurately and concisely.
If the context doesn't contain relevant information, answer from your general knowledge and mention that.
Always be conversational and helpful.

Retrieved Context:
{context}
"""

def format_docs(docs) -> str:
    if not docs:
        return "No relevant documents found."
    parts = []
    for i, doc in enumerate(docs, 1):
        src = doc.metadata.get("source_file", "unknown")
        parts.append(f"[Source {i}: {src}]\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)

def build_history(messages: list[dict]) -> list:
    history = []
    for m in messages:
        if m["role"] == "user":
            history.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            history.append(AIMessage(content=m["content"]))
    return history

async def stream_rag_response(question: str, history: list[dict]) -> AsyncIterator[str]:
    llm = ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        streaming=True,
        temperature=0.7,
    )

    retriever = get_retriever()
    retrieved_docs = retriever.invoke(question)
    context = format_docs(retrieved_docs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{question}"),
    ])

    chain = prompt | llm | StrOutputParser()

    chat_history = build_history(history)

    async for chunk in chain.astream({
        "context": context,
        "question": question,
        "chat_history": chat_history,
    }):
        yield chunk