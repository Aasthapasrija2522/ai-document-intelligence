from pydantic import BaseModel

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

class SearchResult(BaseModel):
    document_id: int
    document_filename: str
    chunk_text: str
    relevance_score: float

class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]