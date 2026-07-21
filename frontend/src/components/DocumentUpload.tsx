import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import { uploadDocument } from '../api/documents';
import type { Document } from '../types';

interface DocumentUploadProps {
  onUploadComplete: (document: Document) => void;
}

function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const response = await uploadDocument(file);
      onUploadComplete(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail);
      } else {
        setError('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-6 border" style={{ backgroundColor: '#161C29', borderColor: '#2A3346' }}>
      <p
        className="text-[11px] tracking-[0.2em] uppercase mb-3"
        style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
      >
        Intake — Document Submission
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="file-upload-input"
      />

      <label
        htmlFor="file-upload-input"
        className="block w-full py-3 text-center text-sm uppercase tracking-wide cursor-pointer transition-opacity hover:opacity-90"
        style={{
          backgroundColor: uploading ? '#2A3346' : '#C9A24B',
          color: uploading ? '#8791A8' : '#10151F',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
        }}
      >
        {uploading ? 'Processing\u2026' : 'Select document (PDF, DOCX, TXT)'}
      </label>

      {error && (
        <p className="mt-3 text-sm" style={{ color: '#C1523A', fontFamily: "'Inter', sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default DocumentUpload;