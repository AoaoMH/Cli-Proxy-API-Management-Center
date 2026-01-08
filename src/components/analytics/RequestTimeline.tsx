import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { RequestTimeline as RequestTimelineData } from '@/services/api/usageRecords';
import { useThemeStore } from '@/stores';
import './RequestTimeline.scss';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RequestTimelineProps {
  data: RequestTimelineData | null;
  title?: string;
  isLoading?: boolean;
  hasError?: boolean;
}

// Format number with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const RequestTimeline = ({ 
  data, 
  title = '请求时间线', 
  isLoading, 
  hasError 
}: RequestTimelineProps) => {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const chartData = useMemo(() => {
    if (!data?.points?.length) {
      return { labels: [], datasets: [] };
    }

    // Extract just the time part for labels (HH:00)
    const labels = data.points.map(p => {
      const timePart = p.hour.split(' ')[1] || p.hour;
      return timePart;
    });

    return {
      labels,
      datasets: [
        {
          label: '请求数',
          data: data.points.map(p => p.requests),
          backgroundColor: isDark 
            ? 'rgba(99, 102, 241, 0.7)' 
            : 'rgba(99, 102, 241, 0.8)',
          borderColor: isDark 
            ? 'rgba(99, 102, 241, 1)' 
            : 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        }
      ]
    };
  }, [data, isDark]);

  const chartOptions = useMemo(() => {
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 24, 39, 0.06)';
    const tickColor = isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(17, 24, 39, 0.72)';
    const tooltipBg = isDark ? 'rgba(17, 24, 39, 0.92)' : 'rgba(255, 255, 255, 0.98)';
    const tooltipTitle = isDark ? '#ffffff' : '#111827';
    const tooltipBody = isDark ? 'rgba(255, 255, 255, 0.86)' : '#374151';
    const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(17, 24, 39, 0.10)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipTitle,
          bodyColor: tooltipBody,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 8,
          callbacks: {
            title: (items: { dataIndex: number }[]) => {
              if (!items.length || !data?.points) return '';
              const point = data.points[items[0].dataIndex];
              return point?.hour || '';
            },
            label: (item: { raw: unknown }) => {
              return `请求: ${item.raw}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: tickColor,
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor
          },
          ticks: {
            color: tickColor,
            font: { size: 10 },
            callback: (value: number | string) => {
              if (typeof value === 'number') {
                return formatNumber(value);
              }
              return value;
            }
          }
        }
      }
    };
  }, [isDark, data]);

  const hasData = data && data.points && data.points.length > 0;
  const totalRequests = data?.points?.reduce((sum, p) => sum + p.requests, 0) || 0;
  const peakHour = data?.points?.reduce((max, p) => 
    p.requests > max.requests ? p : max, 
    { hour: '', requests: 0 }
  );

  if (isLoading) {
    return (
      <div className="request-timeline-card">
        <div className="timeline-header">
          <h3 className="timeline-title">{title}</h3>
        </div>
        <div className="timeline-loading">
          <div className="spinner" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="request-timeline-card">
        <div className="timeline-header">
          <h3 className="timeline-title">{title}</h3>
        </div>
        <div className="timeline-error">
          <span>加载失败</span>
        </div>
      </div>
    );
  }

  return (
    <div className="request-timeline-card">
      <div className="timeline-header">
        <h3 className="timeline-title">{title}</h3>
      </div>

      {!hasData ? (
        <div className="timeline-empty">
          暂无请求数据
        </div>
      ) : (
        <>
          <div className="timeline-stats">
            <span className="stat-item">
              <strong>{formatNumber(totalRequests)}</strong> 总请求
            </span>
            {peakHour && peakHour.requests > 0 && (
              <span className="stat-item">
                <strong>{peakHour.hour.split(' ')[1] || peakHour.hour}</strong> 峰值时段
              </span>
            )}
          </div>

          <div className="timeline-chart-container">
            <Bar 
              data={chartData} 
              options={chartOptions as Parameters<typeof Bar>[0]['options']} 
            />
          </div>
        </>
      )}
    </div>
  );
};
