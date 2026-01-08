import type { ModelStats } from '@/services/api/usageRecords';
import './ModelStatsTable.scss';

interface ModelStatsTableProps {
  data: ModelStats[];
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

// Shorten model name for display
const shortenModelName = (model: string): string => {
  if (model.length <= 25) return model;
  return model.slice(0, 22) + '...';
};

export const ModelStatsTable = ({ data, isLoading, hasError }: ModelStatsTableProps) => {
  if (isLoading) {
    return (
      <div className="model-stats-card">
        <div className="card-header">
          <h3 className="card-title">按模型分析</h3>
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
      <div className="model-stats-card">
        <div className="card-header">
          <h3 className="card-title">按模型分析</h3>
        </div>
        <div className="card-error">加载失败</div>
      </div>
    );
  }

  return (
    <div className="model-stats-card">
      <div className="card-header">
        <h3 className="card-title">按模型分析</h3>
      </div>
      <div className="table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>模型</th>
              <th className="text-right">请求数</th>
              <th className="text-right">成功率</th>
              <th className="text-right">Tokens</th>
              <th className="text-right">平均耗时</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  暂无模型统计数据
                </td>
              </tr>
            ) : (
              data.map((model) => {
                const successRate = model.request_count > 0 
                  ? (model.success_count / model.request_count * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <tr key={`${model.provider}-${model.model}`}>
                    <td className="model-cell">
                      <span className="model-name" title={model.model}>
                        {shortenModelName(model.model)}
                      </span>
                      <span className="provider-badge">{model.provider}</span>
                    </td>
                    <td className="text-right">{formatNumber(model.request_count)}</td>
                    <td className="text-right">
                      <span className={Number(successRate) >= 95 ? 'success' : Number(successRate) >= 80 ? 'warning' : 'error'}>
                        {successRate}%
                      </span>
                    </td>
                    <td className="text-right">{formatNumber(model.total_tokens)}</td>
                    <td className="text-right text-muted">{formatDuration(model.avg_duration_ms)}</td>
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
