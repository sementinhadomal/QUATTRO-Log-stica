import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatCurrency, maskCPF, maskPhone } from '../../utils/format';

interface RecurringClientAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: {
    name: string;
    cpf: string;
    phone: string;
    ordersCount: number;
    totalPaid: number;
    totalOpen: number;
    previousOrders: Array<{ id: string; date: string; value: number; status: string }>;
  };
  onContinue: () => void;
  onCancel: () => void;
}

export const RecurringClientAlert: React.FC<RecurringClientAlertProps> = ({
  open,
  onOpenChange,
  clientData,
  onContinue,
  onCancel
}) => {
  if (!clientData) return null;

  return (
    <Modal 
      open={open} 
      onOpenChange={onOpenChange} 
      title="Aviso de Cliente Recorrente"
      maxWidth="600px"
    >
      <div style={{ padding: '1rem', background: 'rgba(255, 159, 67, 0.1)', border: '1px solid rgba(255, 159, 67, 0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#FF9F43', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <strong>Atenção:</strong> Este cliente já possui cadastro e pedidos anteriores.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#8FA3B8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nome</p>
          <p style={{ margin: 0, fontWeight: 500 }}>{clientData.name} <span style={{ color: '#8FA3B8', fontSize: '0.875rem' }}>({maskCPF(clientData.cpf)})</span></p>
        </div>
        <div>
          <p style={{ color: '#8FA3B8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Telefone</p>
          <p style={{ margin: 0 }}>{maskPhone(clientData.phone)}</p>
        </div>
        <div>
          <p style={{ color: '#8FA3B8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Pago</p>
          <p style={{ margin: 0, color: '#16C784', fontWeight: 600 }}>{formatCurrency(clientData.totalPaid)}</p>
        </div>
        <div>
          <p style={{ color: '#8FA3B8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total em Aberto</p>
          <p style={{ margin: 0, color: '#FF496C', fontWeight: 600 }}>{formatCurrency(clientData.totalOpen)}</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Pedidos Anteriores <span style={{ background: '#1478FF', color: '#fff', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{clientData.ordersCount}X</span></h4>
        <div style={{ background: '#111A27', borderRadius: '0.5rem', border: '1px solid #1C2A3A' }}>
          {clientData.previousOrders.map((order, idx) => (
            <div key={order.id} style={{ padding: '0.75rem 1rem', borderBottom: idx !== clientData.previousOrders.length - 1 ? '1px solid #1C2A3A' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>{order.date}</p>
                <span style={{ fontSize: '0.75rem', color: '#8FA3B8' }}>{order.status}</span>
              </div>
              <p style={{ margin: 0, fontWeight: 500 }}>{formatCurrency(order.value)}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={onContinue}>Continuar mesmo assim</Button>
      </div>
    </Modal>
  );
};

export default RecurringClientAlert;
