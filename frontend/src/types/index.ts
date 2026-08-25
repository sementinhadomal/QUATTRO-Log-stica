export interface User {
  id: string;
  nome?: string;
  name?: string;
  email: string;
  funcao?: string;
  role?: string;
  ativo?: boolean;
  status?: string;
  avatar?: string;
}

export interface Order {
  id: string;
  code?: string;
  codigo?: string;
  status: OrderStatus;
  value?: number;
  valor?: number | string;
  kit?: string;
  kit_nome?: string;
  product?: string;
  produto_nome?: string;
  client?: Client;
  cliente_nome?: string;
  cliente_telefone?: string;
  sellerId?: string;
  vendedor_id?: string;
  sellerName?: string;
  vendedor_nome?: string;
  date?: string;
  criado_em?: string;
  tags?: string[];
  etiquetas?: any[];
}

export interface Client {
  id: string;
  nome?: string;
  name?: string;
  document?: string;
  cpf?: string;
  phone?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  uf?: string;
  total_pedidos?: number;
  total_pago?: number | string;
  total_em_aberto?: number | string;
  ultima_compra?: string | null;
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
