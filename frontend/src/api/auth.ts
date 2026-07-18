import apiClient from './client';
import type { AuthToken, User } from '../types';

export const signup = (email: string, password: string, fullName?: string) => {
  return apiClient.post<User>('/auth/signup', {
    email,
    password,
    full_name: fullName,
  });
};

export const login = (email: string, password: string) => {
  return apiClient.post<AuthToken>('/auth/login', { email, password });
};

export const getCurrentUser = () => {
  return apiClient.get<User>('/auth/me');
};