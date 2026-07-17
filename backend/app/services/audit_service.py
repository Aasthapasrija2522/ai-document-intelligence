from sqlalchemy.orm import Session
from fastapi import Request

from app.models.audit import AuditLog


def log_action(
    db: Session,
    user_id: int | None,
    action: str,
    resource_type: str | None = None,
    resource_id: int | None = None,
    details: dict | None = None,
    request: Request | None = None
):
    ip_address = None
    if request is not None:
        ip_address = request.client.host if request.client else None

    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )

    db.add(audit_entry)
    db.commit()