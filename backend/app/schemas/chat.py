from pydantic import BaseModel
from datetime import datetime
from app.models.chat import MessageRole

class ChatSessionCreate(BaseModel):
    document_id: int | None = None
    title: str = "New Chat"

class ChatSessionResponse(BaseModel):
    id: int
    document_id: int | None
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatReply(BaseModel):
    session_id: int
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse