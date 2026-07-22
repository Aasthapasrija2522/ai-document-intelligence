import apiClient from './client';
import type { SearchResponse } from '../types';

export const searchDocuments = (query: string, topK: number = 5) => {
  return apiClient.post<SearchResponse>('/search/', { query, top_k: topK });
};