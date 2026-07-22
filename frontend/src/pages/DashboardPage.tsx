import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';
import { listDocuments, downloadDocument } from '../api/documents';
import type { Document } from '../types';

function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await listDocuments();
        setDocuments(response.data);
      } catch {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleUploadComplete = (newDocument: Document) => {
    setDocuments((prev) => [newDocument, ...prev]);
  };

  const handleDownload = (documentId: number, filename: string) => {
    downloadDocument(documentId, filename);
  };

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#10151F' }}>
      <div className="max-w-2xl mx-auto">
        <p
          className="text-[11px] tracking-[0.2em] uppercase mb-1"
          style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Access Granted — Session Active
        </p>

        <h1
          className="text-3xl mb-6"
          style={{
            color: '#ECEEF3',
            fontFamily: "'Source Serif 4', serif",
            fontWeight: 600,
          }}
        >
          Document Intelligence Dashboard
        </h1>

        <Link
          to="/search"
          className="inline-block mb-6 text-xs uppercase tracking-wide"
          style={{
            color: '#5FB8B0',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Go to search →
        </Link>
        <Link
          to="/chat"
          className="inline-block mb-6 ml-4 text-xs uppercase tracking-wide"
          style={{ color: '#5FB8B0', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Go to chat →
        </Link>

        <DocumentUpload onUploadComplete={handleUploadComplete} />

        {loading ? (
          <p
            className="text-sm mt-6"
            style={{
              color: '#8791A8',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Loading documents…
          </p>
        ) : (
          <DocumentList
            documents={documents}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;