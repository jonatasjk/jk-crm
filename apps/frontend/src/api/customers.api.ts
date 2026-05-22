import { api } from './client';
import type { Customer, PaginatedResponse, ImportResult } from '@/types/models';
import type { CustomerStage } from '@/types/enums';

export interface CustomerFilters {
  stage?: CustomerStage;
  search?: string;
  page?: number;
  limit?: number;
  notEnrolledInAnySequence?: boolean;
}

export const customersApi = {
  list: (params: CustomerFilters = {}) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),

  get: (id: string) =>
    api.get<Customer & { emailLogs: unknown[]; activities: unknown[] }>(`/customers/${id}`),

  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data),

  update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),

  delete: (id: string) => api.delete(`/customers/${id}`),

  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ImportResult>('/customers/import', form);
  },
};
