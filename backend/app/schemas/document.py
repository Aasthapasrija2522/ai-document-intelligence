from pydantic import BaseModel
from datetime import datetime
from app.models.document import DocumentStatus

class DocumentResponse(BaseModel):
    id: int
    original_filename: str
    file_type: str
    file_size_bytes: int
    status: DocumentStatus
    uploaded_at: datetime

    class Config:
        from_attributes = True