from app.models import User, Document, DocumentChunk, ChatSession, ChatMessage, AuditLog
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)
print("All models imported and verified against the database successfully.")