export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: number;
  booking_ref: string;
  visitor_id: number;
  visitor_name?: string;
  visitor_email?: string;
  ticket_type: 'Adult' | 'Child' | 'Family' | 'Group' | 'VIP';
  price: number;
  booking_date: string;
  visit_date: string;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  qr_code_data: string;
  created_at: string;
}

export interface TicketVerification {
  status: 'success' | 'rejected_duplicate' | 'rejected_invalid';
  message: string;
  ticket?: Ticket;
  verification_time: string;
  previous_verification_time?: string;
  gate_id: string;
}

export interface Attraction {
  id: number;
  name: string;
  japanese_name: string;
  category: 'roller_coaster' | 'horror' | 'family' | 'water' | 'thrill';
  min_height_cm: number;
  duration_seconds: number;
  hourly_capacity: number;
  max_capacity: number;
  status: 'operational' | 'maintenance' | 'temporarily_closed';
  current_wait_time: number;
  visitor_count_today: number;
  operating_hours: string;
  description?: string;
  created_at: string;
}

export interface WaitTimePrediction {
  attraction_id: number;
  attraction_name: string;
  japanese_name: string;
  predicted_wait_time_minutes: number;
  congestion_level: 'Low' | 'Moderate' | 'High' | 'Critical';
  recommended_visiting_window: string;
  confidence_interval: [number, number];
  factors: Record<string, any>;
}

export interface DemandForecastItem {
  date: string;
  day_name: string;
  predicted_visitors: number;
  confidence_lower: number;
  confidence_upper: number;
  expected_revenue_jpy: number;
  is_weekend: boolean;
  is_holiday: boolean;
  recommended_staffing_level: number;
}

export interface DemandForecastResponse {
  next_day_forecast: DemandForecastItem;
  seven_day_forecast: DemandForecastItem[];
  model_metrics: {
    model_name: string;
    r2_score: number;
    mae_visitors: number;
    rmse_visitors: number;
    training_samples: number;
  };
  seasonality_summary: string;
  limitations_and_disclaimer: string;
}

export interface RecommendationItem {
  id: string;
  category: 'Operations' | 'Staffing' | 'Crowd Control' | 'Revenue' | 'Maintenance';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  recommended_action: string;
  created_at: string;
}

export interface DashboardSummary {
  total_visitors_today: number;
  total_tickets_sold_today: number;
  total_revenue_today: number;
  active_attractions_count: number;
  total_attractions_count: number;
  average_wait_time_minutes: number;
  peak_visitor_hour: string;
  daily_visitor_trend: Array<{ date: string; visitors: number; revenue: number }>;
  revenue_trend: Array<{ date: string; ticket_rev: number; merch_rev: number; fnb_rev: number; total: number }>;
  visitor_distribution_by_attraction: Array<{
    name: string;
    japanese_name: string;
    category: string;
    riders_today: number;
    wait_time: number;
    status: string;
  }>;
  recent_verifications: Array<{
    id: number;
    ticket_id: number;
    gate: string;
    status: string;
    time: string;
    reason?: string;
  }>;
  operational_alerts: Array<{
    type: string;
    message: string;
  }>;
}

export interface VisitorAnalytics {
  daily_trends: Array<{ date: string; display_date: string; visitors: number; revenue: number }>;
  hourly_distribution: Array<{ hour: string; visitors: number; congestion: string }>;
  ticket_category_breakdown: Array<{ category: string; count: number }>;
  repeat_visitor_rate: number;
  demographics_by_age: Array<{ age_group: string; count: number }>;
  top_popular_attractions: Array<{ name: string; japanese_name: string; riders: number; category: string; wait_time: number }>;
}

export interface RevenueAnalytics {
  total_revenue: number;
  ticket_revenue: number;
  fnb_revenue: number;
  merchandise_revenue: number;
  growth_rate_pct: number;
  daily_revenue_breakdown: Array<{ date: string; display_date: string; total: number; tickets: number; merchandise: number; fnb: number }>;
  revenue_by_category: Array<{ category: string; revenue: number; sales_count: number }>;
  attraction_popularity_revenue: Array<{ name: string; japanese_name: string; category: string; riders_today: number; attributed_revenue: number }>;
}

export interface ReportItem {
  id: number;
  title: string;
  report_type: 'daily_ops' | 'weekly_visitors' | 'monthly_revenue';
  file_format: 'csv' | 'xlsx' | 'pdf';
  file_path: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  resource: string;
  details?: string;
  ip_address: string;
  created_at: string;
}
