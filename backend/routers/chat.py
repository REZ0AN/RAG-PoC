from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import ChatRoom, Message
from services.rag_service import stream_rag_response
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    room_id: str
    message: str

@router.post("/stream")
async def chat_stream(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Verify room exists
    result = await db.execute(select(ChatRoom).where(ChatRoom.id == body.room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Save user message
    user_msg = Message(room_id=body.room_id, role="user", content=body.message)
    db.add(user_msg)
    room.updated_at = datetime.utcnow()
    await db.commit()

    # Load history (last 20 messages excluding the one just saved)
    hist_result = await db.execute(
        select(Message)
        .where(Message.room_id == body.room_id)
        .order_by(Message.created_at.desc())
        .limit(21)
    )
    all_msgs = list(reversed(hist_result.scalars().all()))
    # Exclude the current user message
    history = [{"role": m.role, "content": m.content} for m in all_msgs[:-1]]

    # Auto-name room on first message
    if room.name == "New Chat" and len(all_msgs) == 1:
        short = body.message[:40]
        room.name = short + ("..." if len(body.message) > 40 else "")
        await db.commit()

    full_response = []

    async def event_generator():
        try:
            async for chunk in stream_rag_response(body.message, history):
                full_response.append(chunk)
                data = json.dumps({"chunk": chunk})
                yield f"data: {data}\n\n"

            # Save assistant message after stream completes
            assistant_content = "".join(full_response)
            async with db.begin_nested():
                assistant_msg = Message(
                    room_id=body.room_id,
                    role="assistant",
                    content=assistant_content,
                )
                db.add(assistant_msg)
            await db.commit()

            yield f"data: {json.dumps({'done': True, 'room_name': room.name})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )