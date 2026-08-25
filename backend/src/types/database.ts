import type { Generated, ColumnType, Insertable, Selectable, Updateable } from 'kysely';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'administrador' | 'gestor' | 'vendedor' | 'logistica' | 'cobrador' | 'visualizador';

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

export type EvidenceType = 'termo' | 'print' | 'audio' | 'pdf' | 'comprovante' | 'etiqueta';

export type PaymentMethod = 'pix' | 'boleto' | 'cartao';

export type PostbackEvent =
  | 'pedido_criado'
  | 'aguardando_confirmacao'
  | 'agendado'
  | 'rastreio'
  | 'em_transito'
  | 'saiu_para_entrega'
  | 'entrega_falhou'
  | 'aguardando_retirada'
  | 'entregue'
  | 'aguardando_pagamento'
  | 'pagamento_aprovado'
  | 'inadimplente'
  | 'em_acordo'
  | 'frustrado'
  | 'devolvido'
  | 'cancelado';

// ─── Table Interfaces ─────────────────────────────────────────────────────────

export interface UsersTable {
  id: Generated<string>;
  nome: string;
  email: string;
  senha_hash: string;
  funcao: UserRole;
  departamento_id: string | null;
  ativo: Generated<boolean>;
  email_braip: string | null;
  link_payt_347: string | null;
  link_payt_497: string | null;
  link_payt_797: string | null;
  comissao: number | null;
  ultimo_login: Date | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
  deletado_em: Date | null;
}

export interface SessionsTable {
  sid: string;
  sess: string;
  expire: Date;
}

export interface PasswordResetsTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expira_em: Date;
  usado: Generated<boolean>;
  criado_em: Generated<Date>;
}

export interface DepartmentsTable {
  id: Generated<string>;
  nome: string;
  descricao: string | null;
  responsavel_id: string | null;
  ativo: Generated<boolean>;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface CollaboratorsTable {
  id: Generated<string>;
  user_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  funcao: UserRole;
  departamento_id: string | null;
  comissao: number | null;
  tipo: string | null;
  ativo: Generated<boolean>;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface ProductsTable {
  id: Generated<string>;
  nome: string;
  descricao: string | null;
  ativo: Generated<boolean>;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface KitsTable {
  id: Generated<string>;
  produto_id: string;
  nome: string;
  quantidade: number;
  preco: number;
  descricao: string | null;
  peso_kg: number;
  altura_cm: number;
  largura_cm: number;
  comprimento_cm: number;
  badge: string | null;
  ordem: number;
  ativo: Generated<boolean>;
  link_payt: string | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface ClientsTable {
  id: Generated<string>;
  cpf: string;
  nome: string;
  telefone: string;
  email: string | null;
  sem_email: Generated<boolean>;
  total_pedidos: Generated<number>;
  total_pago: Generated<number>;
  total_em_aberto: Generated<number>;
  ultima_compra: Date | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
  deletado_em: Date | null;
}

export interface AddressesTable {
  id: Generated<string>;
  client_id: string;
  cep: string;
  uf: string;
  cidade: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  principal: Generated<boolean>;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface WhatsappChannelsTable {
  id: Generated<string>;
  nome: string;
  numero: string;
  ativo: Generated<boolean>;
  criado_em: Generated<Date>;
}

export interface OrdersTable {
  id: Generated<string>;
  codigo: string;
  client_id: string;
  address_id: string | null;
  kit_id: string;
  produto_id: string;
  valor: number;
  status: OrderStatus;
  vendedor_id: string | null;
  cobrador_id: string | null;
  canal_id: string | null;
  observacoes: string | null;
  motivo_frustracao: string | null;
  tentativas_entrega: Generated<number>;
  rastreio_codigo: string | null;
  rastreio_transportadora: string | null;
  rastreio_url: string | null;
  superfrete_id: string | null;
  payt_link: string | null;
  pago_em: Date | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
  deletado_em: Date | null;
}

export interface OrderTagsTable {
  id: Generated<string>;
  order_id: string;
  tag: string;
  cor: string | null;
  criado_em: Generated<Date>;
}

export interface OrderHistoryTable {
  id: Generated<string>;
  order_id: string;
  user_id: string | null;
  status_anterior: OrderStatus | null;
  status_novo: OrderStatus | null;
  descricao: string;
  metadata: string | null;
  criado_em: Generated<Date>;
}

export interface OrderNotesTable {
  id: Generated<string>;
  order_id: string;
  user_id: string;
  texto: string;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface EvidencesTable {
  id: Generated<string>;
  order_id: string;
  tipo: EvidenceType;
  file_id: string;
  descricao: string | null;
  criado_em: Generated<Date>;
}

export interface FilesTable {
  id: Generated<string>;
  nome_original: string;
  nome_disco: string;
  caminho: string;
  mime_type: string;
  tamanho_bytes: number;
  uploaded_by: string | null;
  criado_em: Generated<Date>;
}

export interface ShipmentsTable {
  id: Generated<string>;
  order_id: string;
  superfrete_id: string | null;
  transportadora: string | null;
  servico: string | null;
  valor_frete: number | null;
  prazo_dias: number | null;
  status: string | null;
  etiqueta_url: string | null;
  etiqueta_file_id: string | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface TrackingEventsTable {
  id: Generated<string>;
  order_id: string;
  shipment_id: string | null;
  codigo_rastreio: string | null;
  status_anterior: OrderStatus | null;
  status_novo: OrderStatus | null;
  descricao: string;
  data_evento: Date;
  local: string | null;
  transportadora: string | null;
  origem: string;
  hash_evento: string | null;
  criado_em: Generated<Date>;
}

export interface PaymentsTable {
  id: Generated<string>;
  order_id: string;
  valor: number;
  metodo: PaymentMethod | null;
  status: string;
  payt_id: string | null;
  payt_link: string | null;
  pago_em: Date | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface PaymentReceiptsTable {
  id: Generated<string>;
  payment_id: string;
  order_id: string;
  file_id: string;
  descricao: string | null;
  criado_em: Generated<Date>;
}

export interface TrafficTable {
  id: Generated<string>;
  data: string;
  mes: string;
  gasto: number;
  leads: number;
  cpl: number | null;
  usuario_id: string | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface PostbackConfigsTable {
  id: Generated<string>;
  nome: string;
  url: string;
  eventos: string;
  ativo: Generated<boolean>;
  secret: string | null;
  headers: string | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface PostbackAttemptsTable {
  id: Generated<string>;
  config_id: string;
  order_id: string;
  evento: PostbackEvent;
  payload: string;
  status_http: number | null;
  resposta: string | null;
  sucesso: Generated<boolean>;
  tentativa: Generated<number>;
  proxima_tentativa: Date | null;
  criado_em: Generated<Date>;
  atualizado_em: Generated<Date>;
}

export interface WebhookLogsTable {
  id: Generated<string>;
  origem: string;
  headers: string | null;
  payload: string | null;
  processado: Generated<boolean>;
  erro: string | null;
  criado_em: Generated<Date>;
}

export interface AuditLogsTable {
  id: Generated<string>;
  user_id: string | null;
  acao: string;
  tabela: string | null;
  registro_id: string | null;
  dados_anteriores: string | null;
  dados_novos: string | null;
  ip: string | null;
  user_agent: string | null;
  criado_em: Generated<Date>;
}

// ─── Database Interface ───────────────────────────────────────────────────────

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  password_resets: PasswordResetsTable;
  departments: DepartmentsTable;
  collaborators: CollaboratorsTable;
  products: ProductsTable;
  kits: KitsTable;
  clients: ClientsTable;
  addresses: AddressesTable;
  whatsapp_channels: WhatsappChannelsTable;
  orders: OrdersTable;
  order_tags: OrderTagsTable;
  order_history: OrderHistoryTable;
  order_notes: OrderNotesTable;
  evidences: EvidencesTable;
  files: FilesTable;
  shipments: ShipmentsTable;
  tracking_events: TrackingEventsTable;
  payments: PaymentsTable;
  payment_receipts: PaymentReceiptsTable;
  traffic: TrafficTable;
  postback_configs: PostbackConfigsTable;
  postback_attempts: PostbackAttemptsTable;
  webhook_logs: WebhookLogsTable;
  audit_logs: AuditLogsTable;
}

// ─── Selectable Types ─────────────────────────────────────────────────────────
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UpdateUser = Updateable<UsersTable>;

export type Client = Selectable<ClientsTable>;
export type NewClient = Insertable<ClientsTable>;

export type Order = Selectable<OrdersTable>;
export type NewOrder = Insertable<OrdersTable>;
export type UpdateOrder = Updateable<OrdersTable>;

export type Kit = Selectable<KitsTable>;
export type Product = Selectable<ProductsTable>;
export type Department = Selectable<DepartmentsTable>;
export type Collaborator = Selectable<CollaboratorsTable>;
export type TrackingEvent = Selectable<TrackingEventsTable>;
export type PostbackConfig = Selectable<PostbackConfigsTable>;
export type PostbackAttempt = Selectable<PostbackAttemptsTable>;
export type AuditLog = Selectable<AuditLogsTable>;
export type Traffic = Selectable<TrafficTable>;
export type Payment = Selectable<PaymentsTable>;
export type Shipment = Selectable<ShipmentsTable>;
export type Evidence = Selectable<EvidencesTable>;
export type FileRecord = Selectable<FilesTable>;
