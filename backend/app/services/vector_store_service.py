import os
import faiss
import numpy as np
import pickle

VECTOR_STORE_DIR = "storage/vector_store"
INDEX_PATH = os.path.join(VECTOR_STORE_DIR, "faiss_index.bin")
METADATA_PATH = os.path.join(VECTOR_STORE_DIR, "metadata.pkl")

EMBEDDING_DIMENSION = 384


def _ensure_storage_dir():
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)


def load_index():
    _ensure_storage_dir()
    if os.path.exists(INDEX_PATH) and os.path.exists(METADATA_PATH):
        index = faiss.read_index(INDEX_PATH)
        with open(METADATA_PATH, "rb") as f:
            metadata = pickle.load(f)
    else:
        index = faiss.IndexFlatL2(EMBEDDING_DIMENSION)
        metadata = []

    return index, metadata


def save_index(index, metadata):
    _ensure_storage_dir()
    faiss.write_index(index, INDEX_PATH)
    with open(METADATA_PATH, "wb") as f:
        pickle.dump(metadata, f)


def add_vectors(embeddings: np.ndarray, chunk_metadata: list[dict]) -> list[int]:
    index, metadata = load_index()

    start_id = len(metadata)
    index.add(embeddings)
    metadata.extend(chunk_metadata)

    save_index(index, metadata)

    vector_ids = list(range(start_id, start_id + len(chunk_metadata)))
    return vector_ids


def search_vectors(query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
    index, metadata = load_index()

    if index.ntotal == 0:
        return []

    query_embedding = query_embedding.reshape(1, -1)
    distances, indices = index.search(query_embedding, min(top_k, index.ntotal))

    results = []
    for distance, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        result = metadata[idx].copy()
        result["distance"] = float(distance)
        results.append(result)

    return results