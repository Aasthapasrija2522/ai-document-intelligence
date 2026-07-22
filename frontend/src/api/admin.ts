import apiClient from './client';
import type { AnalyticsData, AuditLogEntry } from '../types';

export const getAnalytics = () => {
  return apiClient.get<AnalyticsData>('/admin/analytics');
};

export const getAuditLogs = (limit: number = 50) => {
  return apiClient.get<AuditLogEntry[]>(`/admin/audit-logs?limit=${limit}`);
};