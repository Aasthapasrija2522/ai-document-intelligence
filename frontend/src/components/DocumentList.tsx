import type { Document, DocumentStatus } from '../types';

interface DocumentListProps {
  documents: Document[];
  onDownload: (documentId: number, filename: string) => void;
}

const STATUS_LABEL: Record<DocumentStatus, string> = {
  uploaded: 'Received',
  processing: 'Analyzing\u2026',
  ready: 'Ready',
  failed: 'Failed',
};

const STATUS_COLOR: Record<DocumentStatus, string> = {
  uploaded: '#8791A8',
  processing: '#5FB8B0',
  ready: '#C9A24B',
  failed: '#C1523A',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentList({ documents, onDownload }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm mt-6" style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}>
        No documents submitted yet.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="p-4 border"
          style={{ backgroundColor: '#161C29', borderColor: '#2A3346' }}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <p
                className="text-sm truncate"
                style={{ color: '#ECEEF3', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
              >
                {doc.original_filename}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: '#8791A8', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {doc.file_type.toUpperCase()} · {formatFileSize(doc.file_size_bytes)}
                {doc.classification && ` · ${doc.classification}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[doc.status] }}
              />
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: STATUS_COLOR[doc.status], fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {STATUS_LABEL[doc.status]}
              </span>
            </div>
          </div>

          {doc.pii_detected && (
            <p
              className="text-xs mt-2 inline-block px-2 py-0.5"
              style={{ color: '#C1523A', border: '1px solid #C1523A', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              PII DETECTED — PREVIEW MASKED
            </p>
          )}

          {doc.summary && (
            <p
              className="text-sm mt-3"
              style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}
            >
              {doc.summary}
            </p>
          )}

          {doc.status === 'ready' && (
            <button
              onClick={() => onDownload(doc.id, doc.original_filename)}
              className="mt-3 text-xs uppercase tracking-wide"
              style={{ color: '#5FB8B0', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Download original ↓
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default DocumentList;