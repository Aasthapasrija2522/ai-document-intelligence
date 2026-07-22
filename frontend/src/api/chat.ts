import apiClient from './client';
import type { ChatSession, ChatMessage, ChatReply } from '../types';

export const createChatSession = (title: string, documentId?: number) => {
  return apiClient.post<ChatSession>('/chat/sessions', {
    title,
    document_id: documentId ?? null,
  });
};

export const listChatSessions = () => {
  return apiClient.get<ChatSession[]>('/chat/sessions');
};

export const getSessionMessages = (sessionId: number) => {
  return apiClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
};

export const sendChatMessage = (sessionId: number, content: string) => {
  return apiClient.post<ChatReply>(`/chat/sessions/${sessionId}/message`, { content });
};