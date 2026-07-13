import io
import fitz  # PyMuPDF
from docx import Document as DocxDocument


class TextExtractionError(Exception):
    pass


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page in pdf:
            text_parts.append(page.get_text())
        pdf.close()
        full_text = "\n".join(text_parts).strip()

        if not full_text:
            raise TextExtractionError("No extractable text found — this may be a scanned/image-only PDF requiring OCR")

        return full_text
    except Exception as e:
        if isinstance(e, TextExtractionError):
            raise
        raise TextExtractionError(f"Failed to parse PDF: {str(e)}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = DocxDocument(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n".join(paragraphs).strip()

        if not full_text:
            raise TextExtractionError("No extractable text found in DOCX file")

        return full_text
    except Exception as e:
        if isinstance(e, TextExtractionError):
            raise
        raise TextExtractionError(f"Failed to parse DOCX: {str(e)}")


def extract_text_from_txt(file_bytes: bytes) -> str:
    try:
        text = file_bytes.decode("utf-8").strip()
        if not text:
            raise TextExtractionError("Text file is empty")
        return text
    except UnicodeDecodeError:
        raise TextExtractionError("Unable to decode text file — file may not be valid UTF-8 text")


def extract_text(file_bytes: bytes, file_extension: str) -> str:
    extractors = {
        ".pdf": extract_text_from_pdf,
        ".docx": extract_text_from_docx,
        ".txt": extract_text_from_txt,
    }

    extractor = extractors.get(file_extension)
    if not extractor:
        raise TextExtractionError(f"No text extractor available for file type: {file_extension}")

    return extractor(file_bytes)