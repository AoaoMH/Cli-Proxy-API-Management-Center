import { ReactNode } from 'react';
import { Card } from './Card';
import './TableCard.scss';

interface TableCardProps {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  pagination?: ReactNode;
  className?: string;
}

export function TableCard({
  title,
  children,
  actions,
  pagination,
  className = ''
}: TableCardProps) {
  return (
    <Card className={`table-card ${className}`}>
      {/* Header with title and actions */}
      {(title || actions) && (
        <div className="table-card-header">
          <div className="table-card-header-content">
            {title && <h3 className="table-card-title">{title}</h3>}
            {actions && <div className="table-card-actions">{actions}</div>}
          </div>
        </div>
      )}

      {/* Table content */}
      <div className="table-card-body">
        {children}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="table-card-pagination">
          {pagination}
        </div>
      )}
    </Card>
  );
}
