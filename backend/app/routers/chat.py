from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chat import ChatSession, ChatMessage, MessageRole
from app.schemas.chat import ChatSessionCreate, ChatSessionResponse, ChatMessageCreate, ChatReply, ChatMessageResponse
from app.services.rag_service import generate_rag_answer

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if session_data.document_id is not None:
        document = db.query(Document).filter(
            Document.id == session_data.document_id,
            Document.owner_id == current_user.id
        ).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

    new_session = ChatSession(
        user_id=current_user.id,
        document_id=session_data.document_id,
        title=session_data.title
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


@router.get("/sessions", response_model=list[ChatSessionResponse])
def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()).all()


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()


@router.post("/sessions/{session_id}/message", response_model=ChatReply)
def send_message(
    session_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    user_message = ChatMessage(
        session_id=session_id,
        role=MessageRole.user,
        content=message_data.content
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    history_rows = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()

    conversation_history = [{"role": h.role.value, "content": h.content} for h in history_rows[:-1]]

    allowed_document_ids = {
        doc.id for doc in db.query(Document.id).filter(Document.owner_id == current_user.id).all()
    }

    answer, _ = generate_rag_answer(
        question=message_data.content,
        allowed_document_ids=allowed_document_ids,
        document_id_filter=session.document_id,
        conversation_history=conversation_history
    )

    assistant_message = ChatMessage(
        session_id=session_id,
        role=MessageRole.assistant,
        content=answer
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatReply(
        session_id=session_id,
        user_message=user_message,
        assistant_message=assistant_message
    )