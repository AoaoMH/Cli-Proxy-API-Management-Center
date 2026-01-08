/**
 * Usage Records API
 * Provides access to API usage history with request/response details
 */

import { apiClient } from './client';

export interface UsageRecord {
  id: number;
  request_id: string;
  timestamp: string;
  ip: string;
  api_key: string;
  api_key_masked: string;
  model: string;
  provider: string;
  is_streaming: boolean;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  duration_ms: number;
  status_code: number;
  success: boolean;
  request_url: string;
  request_method: string;
  request_headers?: Record<string, string>;
  request_body?: string;
  response_headers?: Record<string, string>;
  response_body?: string;
}

export interface UsageRecordsListQuery {
  page?: number;
  page_size?: number;
  api_key?: string;
  model?: string;
  provider?: string;
  start_time?: string;
  end_time?: string;
  success?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UsageRecordsListResult {
  records: UsageRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Activity Heatmap types
export interface ActivityHeatmapDay {
  date: string;
  requests: number;
  total_tokens: number;
}

export interface ActivityHeatmap {
  start_date: string;
  end_date: string;
  total_days: number;
  max_requests: number;
  days: ActivityHeatmapDay[];
}

// Model Stats types
export interface ModelStats {
  model: string;
  provider: string;
  request_count: number;
  success_count: number;
  failure_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  avg_duration_ms: number;
}

export interface ModelStatsResult {
  models: ModelStats[];
  total_models: number;
}

// Provider Stats types
export interface ProviderStats {
  provider: string;
  request_count: number;
  success_count: number;
  failure_count: number;
  total_tokens: number;
  avg_duration_ms: number;
  model_count: number;
}

export interface ProviderStatsResult {
  providers: ProviderStats[];
  total_providers: number;
}

// Usage Summary types
export interface UsageSummary {
  total_requests: number;
  success_requests: number;
  failure_requests: number;
  success_rate: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  avg_duration_ms: number;
  unique_models: number;
  unique_providers: number;
}

export const usageRecordsApi = {
  /**
   * Get paginated list of usage records
   */
  list: (query: UsageRecordsListQuery = {}): Promise<UsageRecordsListResult> =>
    apiClient.get('/usage-records', { params: query }),

  /**
   * Get a single usage record by ID with full details
   */
  getById: (id: number): Promise<UsageRecord> =>
    apiClient.get(`/usage-records/${id}`),

  /**
   * Delete records older than specified days
   */
  deleteOld: (days: number): Promise<{ deleted: number; message: string }> =>
    apiClient.delete('/usage-records', { data: { days } }),

  /**
   * Get activity heatmap data (GitHub-style contribution graph)
   */
  getHeatmap: (days: number = 90): Promise<ActivityHeatmap> =>
    apiClient.get('/usage-records/heatmap', { params: { days } }),

  /**
   * Get usage statistics grouped by model
   */
  getModelStats: (startTime?: string, endTime?: string): Promise<ModelStatsResult> =>
    apiClient.get('/usage-records/model-stats', { params: { start_time: startTime, end_time: endTime } }),

  /**
   * Get usage statistics grouped by provider
   */
  getProviderStats: (startTime?: string, endTime?: string): Promise<ProviderStatsResult> =>
    apiClient.get('/usage-records/provider-stats', { params: { start_time: startTime, end_time: endTime } }),

  /**
   * Get overall usage summary
   */
  getSummary: (startTime?: string, endTime?: string): Promise<UsageSummary> =>
    apiClient.get('/usage-records/summary', { params: { start_time: startTime, end_time: endTime } }),
};
