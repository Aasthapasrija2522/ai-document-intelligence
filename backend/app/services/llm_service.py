import httpx
from app.core.config import settings

MAX_INPUT_CHARS = 6000
OLLAMA_TIMEOUT_SECONDS = 60


class LLMServiceError(Exception):
    pass


def _call_ollama(prompt: str) -> str:
    try:
        response = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
            },
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data["response"].strip()
    except httpx.TimeoutException:
        raise LLMServiceError("The AI model took too long to respond. Try again or use a shorter document.")
    except httpx.ConnectError:
        raise LLMServiceError("Could not connect to the local AI model. Is Ollama running?")
    except Exception as e:
        raise LLMServiceError(f"AI summarization failed: {str(e)}")


def generate_summary(document_text: str) -> str:
    truncated_text = document_text[:MAX_INPUT_CHARS]

    prompt = (
        "Summarize the following document in 3-4 concise sentences. "
        "Focus on the main topic, key points, and purpose of the document. "
        "Do not include any preamble like 'Here is a summary' — just write the summary directly.\n\n"
        f"Document:\n{truncated_text}"
    )

    return _call_ollama(prompt)


def classify_document(document_text: str) -> str:
    truncated_text = document_text[:3000]

    prompt = (
        "Classify the following document into exactly ONE of these categories: "
        "Legal, Financial, Technical, Medical, Academic, Personal, Business, Other. "
        "Respond with ONLY the category name, nothing else.\n\n"
        f"Document:\n{truncated_text}"
    )

    result = _call_ollama(prompt)
    valid_categories = {"Legal", "Financial", "Technical", "Medical", "Academic", "Personal", "Business", "Other"}

    cleaned_result = result.strip().split("\n")[0].strip()
    if cleaned_result not in valid_categories:
        return "Other"

    return cleaned_result