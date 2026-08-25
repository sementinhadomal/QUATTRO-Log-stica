import React from 'react';
import { STATUS_CONFIG } from '../../utils/statusConfig';
import { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  
  if (!config) return null;

  return (
    <span 
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
