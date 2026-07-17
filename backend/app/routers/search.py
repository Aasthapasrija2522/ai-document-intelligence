from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.search import SearchQuery, SearchResponse, SearchResult
from app.services.embedding_service import generate_embeddings
from app.services.vector_store_service import search_vectors
from app.services.audit_service import log_action

router = APIRouter(prefix="/search", tags=["Search"])

MAX_L2_DISTANCE_THRESHOLD = 1.5


@router.post("/", response_model=SearchResponse)
def semantic_search(
    request: Request,
    search_query: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_embedding = generate_embeddings([search_query.query])[0]

    over_fetch_k = search_query.top_k * 4
    raw_results = search_vectors(query_embedding, top_k=over_fetch_k)

    user_document_ids = {
        doc.id
        for doc in db.query(Document.id)
        .filter(Document.owner_id == current_user.id)
        .all()
    }

    filtered_results = [
        r
        for r in raw_results
        if r["document_id"] in user_document_ids
        and r["distance"] <= MAX_L2_DISTANCE_THRESHOLD
    ]

    top_results = filtered_results[: search_query.top_k]

    document_filenames = {
        doc.id: doc.original_filename
        for doc in db.query(Document)
        .filter(Document.id.in_(user_document_ids))
        .all()
    }

    final_results = []
    for r in top_results:
        relevance_score = max(
            0.0,
            1.0 - (
                r["distance"] / (MAX_L2_DISTANCE_THRESHOLD * 2)
            ),
        )

        final_results.append(
            SearchResult(
                document_id=r["document_id"],
                document_filename=document_filenames.get(
                    r["document_id"],
                    "Unknown",
                ),
                chunk_text=r["chunk_text"],
                relevance_score=round(relevance_score, 3),
            )
        )

    log_action(
        db,
        user_id=current_user.id,
        action="search_performed",
        details={
            "query": search_query.query,
            "results_count": len(final_results),
        },
        request=request,
    )

    return SearchResponse(
        query=search_query.query,
        results=final_results,
    )