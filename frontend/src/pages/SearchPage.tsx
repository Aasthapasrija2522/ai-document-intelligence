import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { searchDocuments } from '../api/search';
import type { SearchResult } from '../types';

type SearchState = 'idle' | 'searching' | 'done' | 'error';

function SearchPage() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setState('searching');
    setErrorMessage('');

    try {
      const response = await searchDocuments(query);
      setResults(response.data.results);
      setState('done');
    } catch (err) {
      setState('error');
      if (axios.isAxiosError(err) && err.response) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage('Search failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#10151F' }}>
      <div className="max-w-2xl mx-auto">
        <p
          className="text-[11px] tracking-[0.2em] uppercase mb-1"
          style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Semantic Retrieval
        </p>
        <h1
          className="text-3xl mb-6"
          style={{ color: '#ECEEF3', fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}
        >
          Search your documents
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about anything in your documents…"
            className="flex-1 px-3 py-2 bg-transparent border outline-none"
            style={{ borderColor: '#2A3346', color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}
          />
          <button
            type="submit"
            disabled={state === 'searching'}
            className="px-5 py-2 text-sm uppercase tracking-wide"
            style={{
              backgroundColor: state === 'searching' ? '#2A3346' : '#C9A24B',
              color: state === 'searching' ? '#8791A8' : '#10151F',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            {state === 'searching' ? '…' : 'Search'}
          </button>
        </form>

        {state === 'idle' && (
          <p className="text-sm" style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}>
            Enter a question or topic to search across your uploaded documents.
          </p>
        )}

        {state === 'error' && (
          <p className="text-sm" style={{ color: '#C1523A', fontFamily: "'Inter', sans-serif" }}>
            {errorMessage}
          </p>
        )}

        {state === 'done' && results.length === 0 && (
          <p className="text-sm" style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}>
            No relevant content found in your documents for this query.
          </p>
        )}

        {state === 'done' && results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={`${result.document_id}-${index}`}
                className="p-4 border"
                style={{ backgroundColor: '#161C29', borderColor: '#2A3346' }}
              >
                <div className="flex justify-between items-center mb-2">
                  <p
                    className="text-xs uppercase tracking-wide"
                    style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {result.document_filename}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: '#5FB8B0', fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {Math.round(result.relevance_score * 100)}% match
                  </p>
                </div>

                <div className="h-1 mb-3" style={{ backgroundColor: '#2A3346' }}>
                  <div
                    className="h-1"
                    style={{
                      width: `${result.relevance_score * 100}%`,
                      backgroundColor: '#5FB8B0',
                    }}
                  />
                </div>

                <p
                  className="text-sm"
                  style={{ color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}
                >
                  {result.chunk_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;