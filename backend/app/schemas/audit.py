from pydantic import BaseModel
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    resource_type: str | None
    resource_id: int | None
    details: dict | None
    ip_address: str | None
    created_at: datetime

    class Config:
        from_attributes = True