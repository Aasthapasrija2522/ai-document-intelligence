from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_admin_user

from app.models.user import User
from app.models.document import Document
from app.models.chat import ChatSession
from app.models.audit import AuditLog

from app.schemas.audit import AuditLogResponse
from app.schemas.analytics import AnalyticsResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    limit: int = 50,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_documents = db.query(func.count(Document.id)).scalar()

    status_counts = (
        db.query(Document.status, func.count(Document.id))
        .group_by(Document.status)
        .all()
    )

    documents_by_status = {
        status.value: count for status, count in status_counts
    }

    classification_counts = (
        db.query(Document.classification, func.count(Document.id))
        .filter(Document.classification.isnot(None))
        .group_by(Document.classification)
        .all()
    )

    documents_by_classification = {
        classification: count
        for classification, count in classification_counts
    }

    pii_detected_count = (
        db.query(func.count(Document.id))
        .filter(Document.pii_detected == True)
        .scalar()
    )

    total_chat_sessions = db.query(func.count(ChatSession.id)).scalar()

    total_searches_performed = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.action == "search_performed")
        .scalar()
    )

    return AnalyticsResponse(
        total_users=total_users,
        total_documents=total_documents,
        documents_by_status=documents_by_status,
        documents_by_classification=documents_by_classification,
        pii_detected_count=pii_detected_count,
        total_chat_sessions=total_chat_sessions,
        total_searches_performed=total_searches_performed,
    )