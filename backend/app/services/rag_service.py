from app.services.embedding_service import generate_embeddings
from app.services.vector_store_service import search_vectors
from app.services.llm_service import _call_ollama, LLMServiceError

MAX_CONTEXT_CHUNKS = 4
MAX_HISTORY_MESSAGES = 6


def retrieve_context(query: str, allowed_document_ids: set[int], document_id_filter: int | None = None) -> list[dict]:
    query_embedding = generate_embeddings([query])[0]
    raw_results = search_vectors(query_embedding, top_k=MAX_CONTEXT_CHUNKS * 4)

    filtered = [
        r for r in raw_results
        if r["document_id"] in allowed_document_ids
        and (document_id_filter is None or r["document_id"] == document_id_filter)
    ]

    return filtered[:MAX_CONTEXT_CHUNKS]


def build_rag_prompt(question: str, context_chunks: list[dict], conversation_history: list[dict]) -> str:
    if context_chunks:
        context_text = "\n\n".join(
            f"[Excerpt from document {c['document_id']}]:\n{c['chunk_text']}"
            for c in context_chunks
        )
    else:
        context_text = "No relevant document content was found for this question."

    history_text = ""
    if conversation_history:
        history_lines = [f"{h['role'].capitalize()}: {h['content']}" for h in conversation_history[-MAX_HISTORY_MESSAGES:]]
        history_text = "Previous conversation:\n" + "\n".join(history_lines) + "\n\n"

    prompt = (
        "You are a helpful assistant answering questions strictly based on the provided document excerpts. "
        "If the excerpts do not contain enough information to answer the question, say clearly that you "
        "don't have enough information in the documents to answer, rather than guessing or using outside knowledge.\n\n"
        f"Document excerpts:\n{context_text}\n\n"
        f"{history_text}"
        f"Question: {question}\n\n"
        "Answer:"
    )

    return prompt


def generate_rag_answer(question: str, allowed_document_ids: set[int], document_id_filter: int | None, conversation_history: list[dict]) -> tuple[str, list[dict]]:
    context_chunks = retrieve_context(question, allowed_document_ids, document_id_filter)
    prompt = build_rag_prompt(question, context_chunks, conversation_history)

    try:
        answer = _call_ollama(prompt)
    except LLMServiceError as e:
        answer = f"I'm unable to generate a response right now: {str(e)}"

    return answer, context_chunks