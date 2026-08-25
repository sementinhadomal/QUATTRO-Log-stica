import { OrderStatus } from '../types';

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  aguardando_confirmacao: { label: 'Aguardando Confirmação', color: '#32A7FF', bgColor: 'rgba(50, 167, 255, 0.1)' },
  agendado: { label: 'Agendado / Em Preparação', color: '#1478FF', bgColor: 'rgba(20, 120, 255, 0.1)' },
  em_transito: { label: 'Em Trânsito', color: '#7B5FF5', bgColor: 'rgba(123, 95, 245, 0.1)' },
  saiu_para_entrega: { label: 'Saiu para Entrega', color: '#00D4E0', bgColor: 'rgba(0, 212, 224, 0.1)' },
  entrega_falhou: { label: 'Entrega Falhou', color: '#FF9F43', bgColor: 'rgba(255, 159, 67, 0.1)' },
  aguardando_retirada: { label: 'Aguardando Retirada', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.1)' },
  entregue: { label: 'Entregue', color: '#16C784', bgColor: 'rgba(22, 199, 132, 0.1)' },
  entregue_aguardando_pagamento: { label: 'Entregue – Aguard. Pagamento', color: '#1A6B7A', bgColor: 'rgba(26, 107, 122, 0.1)' },
  inadimplente: { label: 'Inadimplente', color: '#FF496C', bgColor: 'rgba(255, 73, 108, 0.1)' },
  em_acordo: { label: 'Em Acordo', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  pago: { label: 'Pago', color: '#0ECB81', bgColor: 'rgba(14, 203, 129, 0.1)' },
  frustrado: { label: 'Frustrado', color: '#C0392B', bgColor: 'rgba(192, 57, 43, 0.1)' },
  devolvido: { label: 'Devolvido', color: '#7F8C8D', bgColor: 'rgba(127, 140, 141, 0.1)' },
  cancelado: { label: 'Cancelado', color: '#A93226', bgColor: 'rgba(169, 50, 38, 0.1)' }
};
