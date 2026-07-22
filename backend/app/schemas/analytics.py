from pydantic import BaseModel

class AnalyticsResponse(BaseModel):
    total_users: int
    total_documents: int
    documents_by_status: dict[str, int]
    documents_by_classification: dict[str, int]
    pii_detected_count: int
    total_chat_sessions: int
    total_searches_performed: int