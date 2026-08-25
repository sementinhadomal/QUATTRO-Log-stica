import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STATUS_CONFIG } from '../../utils/statusConfig';
import { OrderStatus } from '../../types';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import { api } from '../../services/api';
import NewOrderModal from '../../components/orders/NewOrderModal';
import './KanbanPage.css';
import { Search, Plus, Filter, RefreshCw } from 'lucide-react';

const KANBAN_COLUMNS: OrderStatus[] = [
  'aguardando_confirmacao', 'agendado', 'em_transito', 'saiu_para_entrega',
  'entrega_falhou', 'aguardando_retirada', 'entregue', 'entregue_aguardando_pagamento',
  'inadimplente', 'em_acordo', 'pago', 'frustrado', 'devolvido', 'cancelado'
];

interface KanbanOrder {
  id: string;
  codigo: string;
  valor: number | string;
  status: OrderStatus;
  criado_em: string;
  cliente_nome: string;
  cliente_telefone: string;
  kit_nome: string;
  vendedor_nome?: string;
  etiquetas?: Array<{ tag: string; cor?: string }>;
}

const SortableOrderCard = ({ order }: { order: KanbanOrder }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: order.id });
  const navigate = useNavigate();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const orderValue = typeof order.valor === 'string' ? parseFloat(order.valor) : order.valor;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="kanban-card" 
      onClick={() => navigate(`/pedidos/${order.id}`)}
    >
      <div className="kanban-card-header">
        <span className="order-code">#{order.codigo}</span>
        <span className="order-value">{formatCurrency(orderValue)}</span>
      </div>
      <div className="kanban-card-body">
        <p className="order-client">{order.cliente_nome}</p>
        <p className="order-phone">{formatPhone(order.cliente_telefone || '')}</p>
        <p className="order-kit">{order.kit_nome}</p>
      </div>
      <div className="kanban-card-footer">
        <span className="order-seller">{order.vendedor_nome || '—'}</span>
        <span className="order-date">{formatDate(order.criado_em)}</span>
      </div>
    </div>
  );
};

const KanbanPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch real orders from database (Starts empty = Clean factory mode)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('kanban', 'true');
      if (searchTerm) params.append('q', searchTerm);
      
      const { data } = await api.get(`/pedidos?${params.toString()}`);
      return data as { kanban: Record<string, KanbanOrder[]>; sums: Record<string, number> };
    },
    refetchInterval: 10000, // Refresh every 10s for real-time updates
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      await api.patch(`/pedidos/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const kanbanData = data?.kanban || {};
  const kanbanSums = data?.sums || {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id as string;
    const targetStatus = over.id as OrderStatus;

    if (KANBAN_COLUMNS.includes(targetStatus)) {
      updateStatusMutation.mutate({ orderId: activeId, status: targetStatus });
    }
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div>
          <h2>Kanban de Pedidos</h2>
          <p style={{ fontSize: '0.85rem', color: '#8FA3B8', marginTop: '0.25rem' }}>
            Gerenciamento Afterpay — Modo Operacional Persistente
          </p>
        </div>
        <div className="kanban-actions">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por código, cliente, CPF ou fone..." 
              className="input-field" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary" onClick={() => refetch()} title="Atualizar">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => setIsNewOrderOpen(true)}>
            <Plus size={18} /> Novo Pedido
          </button>
        </div>
      </div>
      
      <div className="kanban-board">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {KANBAN_COLUMNS.map(status => {
            const columnOrders: KanbanOrder[] = kanbanData[status] || [];
            const sum = kanbanSums[status] || 0;
            const config = STATUS_CONFIG[status] || { label: status, color: '#1478FF' };
            
            return (
              <div key={status} id={status} className="kanban-column">
                <div className="kanban-column-header" style={{ borderTopColor: config.color }}>
                  <div className="kanban-column-title">
                    <h3>{config.label}</h3>
                    <span className="count-badge">{columnOrders.length}</span>
                  </div>
                  <div className="kanban-column-sum">{formatCurrency(sum)}</div>
                </div>
                
                <div className="kanban-column-content">
                  <SortableContext items={columnOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    {columnOrders.length > 0 ? (
                      columnOrders.map(order => <SortableOrderCard key={order.id} order={order} />)
                    ) : (
                      <div className="kanban-empty">Nenhum pedido</div>
                    )}
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </DndContext>
      </div>

      <NewOrderModal open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />
    </div>
  );
};

export default KanbanPage;
