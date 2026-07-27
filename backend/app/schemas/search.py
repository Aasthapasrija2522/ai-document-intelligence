from pydantic import BaseModel, field_validator

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("Search query cannot be empty.")
        return value

class SearchResult(BaseModel):
    document_id: int
    document_filename: str
    chunk_text: str
    relevance_score: float

class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]