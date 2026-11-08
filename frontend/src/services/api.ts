import axios from 'axios';
import type {
  User, Ticket, TicketVerification, Attraction,
  WaitTimePrediction, DemandForecastResponse, RecommendationItem,
  DashboardSummary, VisitorAnalytics, RevenueAnalytics,
  ReportItem, AuditLogItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartpark_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  register: async (userData: { email: string; password: string; full_name: string; role: string }) => {
    const res = await api.post<User>('/auth/register', userData);
    return res.data;
  }
};

// Dashboard
export const dashboardApi = {
  getSummary: async () => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  }
};

// Digital Tickets & QR Verification
export const ticketsApi = {
  list: async (params?: { skip?: number; limit?: number; status_filter?: string; ticket_type?: string; search?: string }) => {
    const res = await api.get<Ticket[]>('/tickets', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Ticket>(`/tickets/${id}`);
    return res.data;
  },
  create: async (ticketData: { visitor_name: string; visitor_email: string; visitor_phone?: string; ticket_type: string; visit_date: string; price?: number }) => {
    const res = await api.post<Ticket>('/tickets', ticketData);
    return res.data;
  },
  verify: async (qr_code_or_booking_ref: string, gate_id = 'Main Entrance - Gate 1') => {
    const res = await api.post<TicketVerification>('/tickets/verify', { qr_code_or_booking_ref, gate_id });
    return res.data;
  },
  updateStatus: async (ticketId: number, newStatus: string) => {
    const res = await api.patch<Ticket>(`/tickets/${ticketId}/status?new_status=${newStatus}`);
    return res.data;
  }
};

// Attractions
export const attractionsApi = {
  list: async (category?: string, status_filter?: string) => {
    const res = await api.get<Attraction[]>('/attractions', { params: { category, status_filter } });
    return res.data;
  },
  update: async (id: number, data: Partial<Attraction>) => {
    const res = await api.put<Attraction>(`/attractions/${id}`, data);
    return res.data;
  },
  setStatus: async (id: number, status: string) => {
    const res = await api.patch<Attraction>(`/attractions/${id}/status?status=${status}`);
    return res.data;
  }
};

// Predictions & AI
export const predictionsApi = {
  predictWaitTime: async (params: {
    attraction_id: number;
    hour_of_day: number;
    day_of_week: number;
    is_weekend: boolean;
    is_holiday: boolean;
    weather: string;
    estimated_crowd_factor: number;
  }) => {
    const res = await api.post<WaitTimePrediction>('/predictions/wait-time', params);
    return res.data;
  },
  getMetrics: async () => {
    const res = await api.get('/predictions/metrics');
    return res.data;
  }
};

// Demand Forecasts
export const forecastsApi = {
  getForecasts: async () => {
    const res = await api.get<DemandForecastResponse>('/forecasts');
    return res.data;
  }
};

// Analytics & Revenue
export const analyticsApi = {
  getVisitorAnalytics: async () => {
    const res = await api.get<VisitorAnalytics>('/analytics/visitors');
    return res.data;
  },
  getRevenueAnalytics: async () => {
    const res = await api.get<RevenueAnalytics>('/revenue');
    return res.data;
  }
};

// AI Recommendations
export const recommendationsApi = {
  getRecommendations: async () => {
    const res = await api.get<RecommendationItem[]>('/recommendations');
    return res.data;
  }
};

// Reports
export const reportsApi = {
  list: async () => {
    const res = await api.get<ReportItem[]>('/reports');
    return res.data;
  },
  generate: async (report_type: string, file_format: string) => {
    const res = await api.post<ReportItem>('/reports/generate', { report_type, file_format });
    return res.data;
  },
  getDownloadUrl: (reportId: number) => {
    return `${API_BASE_URL}/reports/${reportId}/download`;
  }
};

// Users & Security
export const usersApi = {
  list: async () => {
    const res = await api.get<User[]>('/users');
    return res.data;
  },
  updateRole: async (userId: number, role: string) => {
    const res = await api.patch<User>(`/users/${userId}/role?new_role=${role}`);
    return res.data;
  },
  toggleStatus: async (userId: number, active: boolean) => {
    const res = await api.patch<User>(`/users/${userId}/status?active=${active}`);
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get<AuditLogItem[]>('/users/audit-logs');
    return res.data;
  }
};
