from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_admin_user
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    limit: int = 50,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()