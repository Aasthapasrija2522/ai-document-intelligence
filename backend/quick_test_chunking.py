# quick_test_chunking.py
from app.services.chunking_service import chunk_text

sample = " ".join([f"word{i}" for i in range(1200)])
chunks = chunk_text(sample)
print(f"Number of chunks: {len(chunks)}")
for i, c in enumerate(chunks):
    print(f"Chunk {i}: {len(c.split())} words")