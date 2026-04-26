import axios from 'axios';
import type { SearchRequest, SearchResponse, Report } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Search API
export const searchApi = {
  execute: async (request: SearchRequest): Promise<SearchResponse> => {
    const response = await api.post<SearchResponse>('/search', request);
    return response.data;
  },
  
  getResults: async (queryId: string): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>(`/results/${queryId}`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  list: async (): Promise<Report[]> => {
    const response = await api.get<Report[]>('/reports');
    return response.data;
  },
  
  get: async (id: string): Promise<Report> => {
    const response = await api.get<Report>(`/reports/${id}`);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/reports/${id}`);
  },
};

export default api;
