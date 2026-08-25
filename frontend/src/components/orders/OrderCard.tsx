import React from 'react';
import { Order } from '../../types';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import StatusBadge from '../ui/StatusBadge';

interface OrderCardProps {
  order: Order;
  onClick?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  return (
    <div 
      onClick={() => onClick && onClick(order)}
      style={{
        background: '#0D131D',
        border: '1px solid #1C2A3A',
        borderRadius: '0.5rem',
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease'
      }}
      onMouseOver={(e) => {
        if (onClick) e.currentTarget.style.borderColor = '#1478FF';
      }}
      onMouseOut={(e) => {
        if (onClick) e.currentTarget.style.borderColor = '#1C2A3A';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 600, color: '#1478FF' }}>{order.code}</span>
        <span style={{ fontWeight: 600, color: '#16C784' }}>{formatCurrency(order.value)}</span>
      </div>
      
      <div style={{ marginBottom: '0.75rem' }}>
        <p style={{ fontWeight: 500, margin: '0 0 0.25rem 0' }}>{order.client.name}</p>
        <p style={{ color: '#8FA3B8', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>{formatPhone(order.client.phone)}</p>
        <p style={{ 
          color: '#8FA3B8', 
          fontSize: '0.75rem', 
          background: '#111A27', 
          padding: '0.25rem 0.5rem', 
          borderRadius: '0.25rem', 
          display: 'inline-block',
          margin: 0
        }}>
          {order.kit}
        </p>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1C2A3A', paddingTop: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>{order.sellerName}</span>
        <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>{formatDate(order.date)}</span>
      </div>
      
      <div style={{ marginTop: '0.75rem' }}>
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
};

export default OrderCard;
