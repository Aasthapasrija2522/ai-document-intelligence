import os

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


def validate_file_extension(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '{ext}' is not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    return ext


def validate_file_size(file_size: int):
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File exceeds maximum size of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB")
    if file_size == 0:
        raise ValueError("File is empty")