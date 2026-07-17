import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from fastapi import Request
from app.services.audit_service import log_action

from app.core.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.document import Document, DocumentStatus

from app.schemas.document import DocumentResponse
from app.services.chunking_service import chunk_text
from app.services.embedding_service import generate_embeddings
from app.services.vector_store_service import add_vectors
from app.models.document import DocumentChunk

from app.services.encryption_service import (
    encrypt_bytes,
    decrypt_bytes,
)

from app.services.file_validation_service import (
    validate_file_extension,
    validate_file_size,
)

from app.services.text_extraction_service import (
    extract_text,
    TextExtractionError,
)

from app.services.llm_service import (
    generate_summary,
    classify_document,
    LLMServiceError,
)

from app.services.pii_service import (
    detect_pii,
    mask_pii,
)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

STORAGE_DIR = "storage/documents"


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ----------------------------
    # Validate extension
    # ----------------------------
    try:
        ext = validate_file_extension(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # ----------------------------
    # Read file
    # ----------------------------
    file_bytes = await file.read()

    # ----------------------------
    # Validate size
    # ----------------------------
    try:
        validate_file_size(len(file_bytes))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # ----------------------------
    # Generate filename
    # ----------------------------
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = os.path.join(STORAGE_DIR, unique_filename)

    # ----------------------------
    # Encrypt and save
    # ----------------------------
    encrypted_bytes = encrypt_bytes(file_bytes)

    os.makedirs(STORAGE_DIR, exist_ok=True)

    with open(storage_path, "wb") as f:
        f.write(encrypted_bytes)

    # ----------------------------
    # Create database record
    # ----------------------------
    new_document = Document(
        owner_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=ext.replace(".", ""),
        file_size_bytes=len(file_bytes),
        storage_path=storage_path,
        status=DocumentStatus.processing,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    # ----------------------------
    # Process document
    # ----------------------------
    try:
        extracted_text = extract_text(file_bytes, ext)

        new_document.extracted_text_preview = extracted_text[:1000]
        new_document.status = DocumentStatus.processing

        db.commit()

        # ------------------------
        # AI Summary & Classification
        # ------------------------
        try:
            new_document.summary = generate_summary(extracted_text)
            new_document.classification = classify_document(extracted_text)

        except LLMServiceError as e:
            new_document.summary = f"Summary unavailable: {str(e)}"
            new_document.classification = "Unclassified"

        # ------------------------
        # Detect PII
        # ------------------------
        pii_result = detect_pii(extracted_text)

        new_document.pii_detected = pii_result["pii_detected"]
        chunks = chunk_text(extracted_text)
        if chunks:
            embeddings = generate_embeddings(chunks)

            chunk_metadata = [
                {"document_id": new_document.id, "chunk_index": i, "chunk_text": chunk}
                for i, chunk in enumerate(chunks)
            ]

            vector_ids = add_vectors(embeddings, chunk_metadata)

            for i, (chunk, vector_id) in enumerate(zip(chunks, vector_ids)):
                db_chunk = DocumentChunk(
                    document_id=new_document.id,
                    chunk_index=i,
                    chunk_text=chunk,
                    vector_id=str(vector_id)
                )
                db.add(db_chunk)

        # ------------------------
        # Mask PII in preview
        # ------------------------
        if pii_result["pii_detected"]:
            new_document.extracted_text_preview = mask_pii(
                extracted_text[:1000]
            )

        # ------------------------
        # Processing complete
        # ------------------------
        new_document.status = DocumentStatus.ready
        new_document.processed_at = datetime.utcnow()

    except TextExtractionError as e:
        new_document.status = DocumentStatus.failed
        new_document.extracted_text_preview = (
            f"Extraction failed: {str(e)}"
        )

    except Exception as e:
        new_document.status = DocumentStatus.failed
        new_document.extracted_text_preview = (
        f"Processing failed: {str(e)}"
    )

    finally:
        db.commit()
        db.refresh(new_document)

    log_action(
        db,
        user_id=current_user.id,
        action="document_uploaded",
        resource_type="document",
        resource_id=new_document.id,
        details={
            "filename": new_document.original_filename,
            "status": new_document.status.value,
        },
        request=request,
    )

    return new_document


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.owner_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    with open(document.storage_path, "rb") as f:
        encrypted_bytes = f.read()

    decrypted_bytes = decrypt_bytes(encrypted_bytes)

    log_action(
        db,
        user_id=current_user.id,
        action="document_downloaded",
        resource_type="document",
        resource_id=document.id,
        details={
            "filename": document.original_filename,
        },
        request=request,
    )

    return Response(
        content=decrypted_bytes,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{document.original_filename}"'
        },
    )