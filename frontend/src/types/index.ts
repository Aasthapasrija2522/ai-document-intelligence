export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export type DocumentStatus = "uploaded" | "processing" | "ready" | "failed";

export interface Document {
  id: number;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  extracted_text_preview: string | null;
  summary: string | null;
  classification: string | null;
  pii_detected: boolean;
  uploaded_at: string;
  processed_at: string | null;
}

export interface SearchResult {
  document_id: number;
  document_filename: string;
  chunk_text: string;
  relevance_score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export interface ChatSession {
  id: number;
  document_id: number | null;
  title: string;
  created_at: string;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ChatReply {
  session_id: number;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}
export interface AnalyticsData {
  total_users: number;
  total_documents: number;
  documents_by_status: Record<string, number>;
  documents_by_classification: Record<string, number>;
  pii_detected_count: number;
  total_chat_sessions: number;
  total_searches_performed: number;
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  resource_type: string | null;
  resource_id: number | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}