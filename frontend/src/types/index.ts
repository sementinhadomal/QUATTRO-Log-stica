export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'seller' | 'driver';
  status: 'active' | 'suspended';
  avatar?: string;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  value: number;
  kit: string;
  product: string;
  client: Client;
  sellerId: string;
  sellerName: string;
  date: string;
  tags: string[];
}

export interface Client {
  id: string;
  name: string;
  document: string; // CPF
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  ordersCount: number;
  totalPaid: number;
  totalOpen: number;
  lastPurchaseDate?: string;
}

export type OrderStatus =
  | 'aguardando_confirmacao'
  | 'agendado'
  | 'em_transito'
  | 'saiu_para_entrega'
  | 'entrega_falhou'
  | 'aguardando_retirada'
  | 'entregue'
  | 'entregue_aguardando_pagamento'
  | 'inadimplente'
  | 'em_acordo'
  | 'pago'
  | 'frustrado'
  | 'devolvido'
  | 'cancelado';
