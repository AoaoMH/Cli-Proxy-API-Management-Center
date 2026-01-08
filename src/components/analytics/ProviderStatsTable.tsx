import type { ProviderStats } from '@/services/api/usageRecords';
import './ProviderStatsTable.scss';

interface ProviderStatsTableProps {
  data: ProviderStats[];
  isLoading?: boolean;
  hasError?: boolean;
}

// Format number with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Format duration
const formatDuration = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
};

export const ProviderStatsTable = ({ data, isLoading, hasError }: ProviderStatsTableProps) => {
  if (isLoading) {
    return (
      <div className="provider-stats-card">
        <div className="card-header">
          <h3 className="card-title">按提供商分析</h3>
        </div>
        <div className="card-loading">
          <div className="spinner" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="provider-stats-card">
        <div className="card-header">
          <h3 className="card-title">按提供商分析</h3>
        </div>
        <div className="card-error">加载失败</div>
      </div>
    );
  }

  return (
    <div className="provider-stats-card">
      <div className="card-header">
        <h3 className="card-title">按提供商分析</h3>
      </div>
      <div className="table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>提供商</th>
              <th className="text-right">请求数</th>
              <th className="text-right">成功率</th>
              <th className="text-right">模型数</th>
              <th className="text-right">Tokens</th>
              <th className="text-right">平均耗时</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  暂无提供商统计数据
                </td>
              </tr>
            ) : (
              data.map((provider) => {
                const successRate = provider.request_count > 0 
                  ? (provider.success_count / provider.request_count * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <tr key={provider.provider}>
                    <td className="provider-cell">
                      <span className="provider-name">{provider.provider || '-'}</span>
                    </td>
                    <td className="text-right">{formatNumber(provider.request_count)}</td>
                    <td className="text-right">
                      <span className={Number(successRate) >= 95 ? 'success' : Number(successRate) >= 80 ? 'warning' : 'error'}>
                        {successRate}%
                      </span>
                    </td>
                    <td className="text-right">{provider.model_count}</td>
                    <td className="text-right">{formatNumber(provider.total_tokens)}</td>
                    <td className="text-right text-muted">{formatDuration(provider.avg_duration_ms)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
