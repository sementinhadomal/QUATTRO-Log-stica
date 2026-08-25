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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { STATUS_CONFIG } from '../../utils/statusConfig';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import './KanbanPage.css';
import { Search, Plus, Filter } from 'lucide-react';

const KANBAN_COLUMNS: OrderStatus[] = [
  'aguardando_confirmacao', 'agendado', 'em_transito', 'saiu_para_entrega',
  'entrega_falhou', 'aguardando_retirada', 'entregue', 'entregue_aguardando_pagamento',
  'inadimplente', 'em_acordo', 'pago', 'frustrado', 'devolvido', 'cancelado'
];

// Mock Data
const mockOrders: Order[] = [
  { id: '1', code: '#1001', status: 'aguardando_confirmacao', value: 347, kit: 'QUATTRO 4-em-1 (1 pote)', product: 'QUATTRO', client: { id: 'c1', name: 'João Silva', phone: '11999999999', document: '', ordersCount: 1, totalOpen: 0, totalPaid: 0 }, sellerId: 's1', sellerName: 'Carlos', date: '2023-10-24T10:00:00Z', tags: ['Novo'] },
  { id: '2', code: '#1002', status: 'agendado', value: 497, kit: 'QUATTRO 4-em-1 (2 potes)', product: 'QUATTRO', client: { id: 'c2', name: 'Maria Souza', phone: '11888888888', document: '', ordersCount: 1, totalOpen: 0, totalPaid: 0 }, sellerId: 's2', sellerName: 'Ana', date: '2023-10-24T11:00:00Z', tags: [] },
];

const SortableOrderCard = ({ order }: { order: Order }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: order.id });
  const navigate = useNavigate();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-card" onClick={() => navigate(`/pedidos/${order.id}`)}>
      <div className="kanban-card-header">
        <span className="order-code">{order.code}</span>
        <span className="order-value">{formatCurrency(order.value)}</span>
      </div>
      <div className="kanban-card-body">
        <p className="order-client">{order.client.name}</p>
        <p className="order-phone">{formatPhone(order.client.phone)}</p>
        <p className="order-kit">{order.kit}</p>
      </div>
      <div className="kanban-card-footer">
        <span className="order-seller">{order.sellerName}</span>
        <span className="order-date">{formatDate(order.date)}</span>
      </div>
    </div>
  );
};

const KanbanPage = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId !== overId) {
      // Logic to reorder or move between columns (Simplified for brevity)
    }
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2>Kanban de Pedidos</h2>
        <div className="kanban-actions">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Buscar pedidos..." className="input-field" />
          </div>
          <button className="btn-secondary"><Filter size={18} /> Filtrar</button>
          <button className="btn-primary" onClick={() => alert('Abrir Modal Novo Pedido')}><Plus size={18} /> Novo Pedido</button>
        </div>
      </div>
      
      <div className="kanban-board">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {KANBAN_COLUMNS.map(status => {
            const columnOrders = orders.filter(o => o.status === status);
            const sum = columnOrders.reduce((acc, o) => acc + o.value, 0);
            const config = STATUS_CONFIG[status];
            
            return (
              <div key={status} className="kanban-column">
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
    </div>
  );
};

export default KanbanPage;
