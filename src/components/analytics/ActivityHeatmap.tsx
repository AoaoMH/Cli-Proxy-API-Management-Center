import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityHeatmap as ActivityHeatmapData, ActivityHeatmapDay } from '@/services/api/usageRecords';
import './ActivityHeatmap.scss';

interface ActivityHeatmapProps {
  data: ActivityHeatmapData | null;
  title?: string;
  isLoading?: boolean;
  hasError?: boolean;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const MIN_CELL_SIZE = 6;
const DEFAULT_CELL_SIZE = 10;

// Get intensity level (0-4) based on request count
const getIntensityLevel = (requests: number, maxRequests: number): number => {
  if (requests === 0) return 0;
  if (maxRequests === 0) return 0;
  
  const ratio = requests / maxRequests;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

// Format number with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const ActivityHeatmap = ({ data, title = '活跃天数', isLoading, hasError }: ActivityHeatmapProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [cellGap, setCellGap] = useState(4);

  const { weeks, monthLabels } = useMemo(() => {
    if (!data?.days?.length) {
      return { weeks: [], monthLabels: [] };
    }

    // Group days into weeks (starting from Sunday)
    const weeks: ActivityHeatmapDay[][] = [];
    const monthLabels: { month: string; colStart: number }[] = [];

    let currentWeek: ActivityHeatmapDay[] = [];
    let currentMonth = -1;

    // Parse the start date to find the first day of week
    const startDate = new Date(`${data.days[0].date}T00:00:00Z`);
    const startDayOfWeek = startDate.getUTCDay();

    // Pad the first week with empty days
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: '', requests: -1, total_tokens: 0 });
    }

    data.days.forEach((day) => {
      const date = new Date(`${day.date}T00:00:00Z`);
      const month = date.getUTCMonth();
      const dayOfWeek = date.getUTCDay();

      // Track month changes for labels
      if (month !== currentMonth) {
        currentMonth = month;
        monthLabels.push({
          month: MONTHS[month],
          colStart: weeks.length,
        });
      }

      currentWeek.push(day);

      // If Saturday (end of week), start new week
      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Push remaining days
    if (currentWeek.length > 0) {
      // Pad the last week with empty days
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', requests: -1, total_tokens: 0 });
      }
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels };
  }, [data]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateSizing = () => {
      const width = el.clientWidth;
      const isSmall = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
      const gap = isSmall ? 2 : 4;
      setCellGap(gap);

      const colCount = weeks.length;
      if (!colCount || width <= 0) {
        setCellSize(DEFAULT_CELL_SIZE);
        return;
      }

      // Match Aether: fit cells to available width, minimum size.
      const reserved = 24; // weekday labels + padding
      const available = Math.max(width - reserved, 0);
      const totalGap = Math.max(colCount - 1, 0) * gap;
      const raw = (available - totalGap) / colCount;
      setCellSize(Math.max(MIN_CELL_SIZE, Math.floor(raw)));
    };

    updateSizing();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateSizing());
      ro.observe(el);
    }

    const onResize = () => updateSizing();
    window.addEventListener('resize', onResize);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [weeks.length]);

  const hasData = data && data.days && data.days.length > 0;
  const activeDays = data?.days?.filter(d => d.requests > 0).length || 0;

  if (isLoading) {
    return (
      <div className="activity-heatmap-card">
        <div className="heatmap-header">
          <h3 className="heatmap-title">{title}</h3>
        </div>
        <div className="heatmap-loading">
          <div className="spinner" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="activity-heatmap-card">
        <div className="heatmap-header">
          <h3 className="heatmap-title">{title}</h3>
        </div>
        <div className="heatmap-error">
          <span>加载失败</span>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-heatmap-card">
      <div className="heatmap-header">
        <h3 className="heatmap-title">{title}</h3>
        {hasData && (
          <div className="heatmap-legend">
            <span className="legend-label">少</span>
            {[0.08, 0.25, 0.45, 0.65, 0.85].map((level, i) => (
              <div 
                key={i} 
                className="legend-cell"
                style={{ opacity: level }}
              />
            ))}
            <span className="legend-label">多</span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="heatmap-empty">
          暂无活跃数据
        </div>
      ) : (
        <>
          <div className="heatmap-stats">
            <span className="stat-item">
              <strong>{activeDays}</strong> 活跃天数
            </span>
            <span className="stat-item">
              <strong>{formatNumber(data.max_requests)}</strong> 最高请求
            </span>
          </div>

          <div className="heatmap-container" ref={wrapperRef}>
            <div className="month-labels" style={{ gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)` }}>
              {monthLabels.map((label, i) => (
                <span 
                  key={i} 
                  className="month-label"
                  style={{ gridColumn: label.colStart + 1 }}
                >
                  {label.month}
                </span>
              ))}
            </div>

            <div className="heatmap-grid-wrapper" style={{ columnGap: `${cellGap}px` }}>
              <div className="weekday-labels" style={{ rowGap: `${cellGap}px` }}>
                {WEEKDAYS.map((day, i) => (
                  <span key={i} className="weekday-label" style={{ height: `${cellSize}px` }}>
                    {i % 2 === 1 ? day : ''}
                  </span>
                ))}
              </div>

              <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)`, gap: `${cellGap}px` }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="heatmap-week" style={{ rowGap: `${cellGap}px` }}>
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`heatmap-cell ${day.requests < 0 ? 'empty' : ''}`}
                        style={{ width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: Math.max(2, Math.floor(cellSize / 4)) }}
                        data-level={day.requests >= 0 ? getIntensityLevel(day.requests, data.max_requests) : 0}
                        title={day.date ? `${day.date}: ${day.requests} 请求, ${formatNumber(day.total_tokens)} tokens` : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
