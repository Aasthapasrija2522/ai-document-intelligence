from pydantic import BaseModel
from datetime import datetime
from app.models.document import DocumentStatus

class DocumentResponse(BaseModel):
    id: int
    original_filename: str
    file_type: str
    file_size_bytes: int
    status: DocumentStatus
    extracted_text_preview: str | None
    uploaded_at: datetime
    processed_at: datetime | None

    class Config:
        from_attributes = True