from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models import ChatRoom, Message
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/rooms", tags=["rooms"])

class RoomCreate(BaseModel):
    name: str = "New Chat"

class RoomRename(BaseModel):
    name: str

@router.get("/")
async def list_rooms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatRoom).order_by(ChatRoom.updated_at.desc())
    )
    rooms = result.scalars().all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat(),
        }
        for r in rooms
    ]

@router.post("/")
async def create_room(body: RoomCreate, db: AsyncSession = Depends(get_db)):
    room = ChatRoom(name=body.name)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return {"id": room.id, "name": room.name, "created_at": room.created_at.isoformat()}

@router.patch("/{room_id}")
async def rename_room(room_id: str, body: RoomRename, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.name = body.name
    room.updated_at = datetime.utcnow()
    await db.commit()
    return {"id": room.id, "name": room.name}

@router.delete("/{room_id}")
async def delete_room(room_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ChatRoom).where(ChatRoom.id == room_id))
    await db.commit()
    return {"deleted": True}

@router.get("/{room_id}/messages")
async def get_messages(room_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message).where(Message.room_id == room_id).order_by(Message.created_at)
    )
    msgs = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ]