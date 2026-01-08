import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Select } from './Select';
import './Pagination.scss';

interface PaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  current,
  total,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const { t } = useTranslation();
  
  const totalPages = Math.ceil(total / pageSize);
  
  // Calculate record range
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === current) return;
    onPageChange(page);
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    if (newSize !== pageSize && onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  if (total === 0) return null;

  return (
    <div className="pagination-container">
      {/* Left: Record range and page size */}
      <div className="pagination-info">
        <span className="pagination-range">
          {t('pagination.showing', { 
            defaultValue: '显示 {{start}}-{{end}} 条，共 {{total}} 条',
            start,
            end,
            total
          })}
        </span>
        {showPageSizeSelector && onPageSizeChange && (
          <Select
            value={String(pageSize)}
            onChange={handlePageSizeChange}
            options={pageSizeOptions.map(size => ({
              value: String(size),
              label: t('pagination.per_page', { defaultValue: '{{size}} 条/页', size })
            }))}
            className="page-size-select"
          />
        )}
      </div>

      {/* Right: Page buttons */}
      <div className="pagination-controls">
        <Button
          variant="secondary"
          size="sm"
          disabled={current === 1}
          onClick={() => handlePageChange(1)}
        >
          {t('pagination.first', { defaultValue: '首页' })}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={current === 1}
          onClick={() => handlePageChange(current - 1)}
        >
          {t('pagination.prev', { defaultValue: '上一页' })}
        </Button>

        {/* Page number buttons */}
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <Button
              key={index}
              variant={page === current ? 'primary' : 'secondary'}
              size="sm"
              className={`page-number ${page === current ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="pagination-ellipsis">{page}</span>
          )
        ))}

        <Button
          variant="secondary"
          size="sm"
          disabled={current === totalPages}
          onClick={() => handlePageChange(current + 1)}
        >
          {t('pagination.next', { defaultValue: '下一页' })}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={current === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {t('pagination.last', { defaultValue: '末页' })}
        </Button>
      </div>
    </div>
  );
}
