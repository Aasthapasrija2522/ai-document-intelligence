import apiClient from './client';
import type { Document } from '../types';

export const uploadDocument = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<Document>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listDocuments = () => {
  return apiClient.get<Document[]>('/documents/');
};

export const downloadDocument = (documentId: number, filename: string) => {
  return apiClient
    .get(`/documents/${documentId}/download`, { responseType: 'blob' })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
};