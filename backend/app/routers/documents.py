import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.encryption_service import encrypt_bytes, decrypt_bytes
from app.services.file_validation_service import validate_file_extension, validate_file_size, MAX_FILE_SIZE_BYTES

router = APIRouter(prefix="/documents", tags=["Documents"])

STORAGE_DIR = "storage/documents"


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        ext = validate_file_extension(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    file_bytes = await file.read()

    try:
        validate_file_size(len(file_bytes))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = os.path.join(STORAGE_DIR, unique_filename)

    encrypted_bytes = encrypt_bytes(file_bytes)

    os.makedirs(STORAGE_DIR, exist_ok=True)
    with open(storage_path, "wb") as f:
        f.write(encrypted_bytes)

    new_document = Document(
        owner_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=ext.replace(".", ""),
        file_size_bytes=len(file_bytes),
        storage_path=storage_path,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Document).filter(Document.owner_id == current_user.id).order_by(Document.uploaded_at.desc()).all()



from fastapi.responses import Response

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    with open(document.storage_path, "rb") as f:
        encrypted_bytes = f.read()

    decrypted_bytes = decrypt_bytes(encrypted_bytes)

    return Response(
        content=decrypted_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{document.original_filename}"'}
    )