-- Migration: 001_initial_schema
-- QUATTRO Logística - Schema Completo
-- Created: 2026

BEGIN;

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'administrador', 'gestor', 'vendedor', 'logistica', 'cobrador', 'visualizador'
);

CREATE TYPE order_status AS ENUM (
  'aguardando_confirmacao',
  'agendado',
  'em_transito',
  'saiu_para_entrega',
  'entrega_falhou',
  'aguardando_retirada',
  'entregue',
  'entregue_aguardando_pagamento',
  'inadimplente',
  'em_acordo',
  'pago',
  'frustrado',
  'devolvido',
  'cancelado'
);

CREATE TYPE evidence_type AS ENUM (
  'termo', 'print', 'audio', 'pdf', 'comprovante', 'etiqueta'
);

CREATE TYPE payment_method AS ENUM (
  'pix', 'boleto', 'cartao'
);

CREATE TYPE postback_event AS ENUM (
  'pedido_criado',
  'aguardando_confirmacao',
  'agendado',
  'rastreio',
  'em_transito',
  'saiu_para_entrega',
  'entrega_falhou',
  'aguardando_retirada',
  'entregue',
  'aguardando_pagamento',
  'pagamento_aprovado',
  'inadimplente',
  'em_acordo',
  'frustrado',
  'devolvido',
  'cancelado'
);

-- ─── Departments ─────────────────────────────────────────────────────────────
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  responsavel_id UUID,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  funcao user_role NOT NULL DEFAULT 'visualizador',
  departamento_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  email_braip VARCHAR(255),
  link_payt_347 TEXT,
  link_payt_497 TEXT,
  link_payt_797 TEXT,
  comissao DECIMAL(5,2),
  ultimo_login TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deletado_em IS NULL;
CREATE INDEX idx_users_funcao ON users(funcao) WHERE deletado_em IS NULL;

-- ─── Sessions ────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX idx_sessions_expire ON sessions(expire);

-- ─── Password Resets ─────────────────────────────────────────────────────────
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token_hash);

-- ─── Collaborators ───────────────────────────────────────────────────────────
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  funcao user_role NOT NULL DEFAULT 'vendedor',
  departamento_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  comissao DECIMAL(5,2),
  tipo VARCHAR(50),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Kits ────────────────────────────────────────────────────────────────────
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  quantidade INT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  peso_kg DECIMAL(6,3) NOT NULL DEFAULT 0.5,
  altura_cm DECIMAL(6,2) NOT NULL DEFAULT 10,
  largura_cm DECIMAL(6,2) NOT NULL DEFAULT 10,
  comprimento_cm DECIMAL(6,2) NOT NULL DEFAULT 15,
  badge VARCHAR(50),
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  link_payt TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Clients ─────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpf VARCHAR(14) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  sem_email BOOLEAN NOT NULL DEFAULT FALSE,
  total_pedidos INT NOT NULL DEFAULT 0,
  total_pago DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_em_aberto DECIMAL(12,2) NOT NULL DEFAULT 0,
  ultima_compra TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMPTZ
);

CREATE INDEX idx_clients_cpf ON clients(cpf) WHERE deletado_em IS NULL;
CREATE INDEX idx_clients_nome ON clients USING gin(nome gin_trgm_ops) WHERE deletado_em IS NULL;
CREATE INDEX idx_clients_telefone ON clients(telefone) WHERE deletado_em IS NULL;

-- ─── Addresses ───────────────────────────────────────────────────────────────
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cep VARCHAR(9) NOT NULL,
  uf CHAR(2) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  rua VARCHAR(200) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  complemento VARCHAR(100),
  principal BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_client ON addresses(client_id);

-- ─── WhatsApp Channels ───────────────────────────────────────────────────────
CREATE TABLE whatsapp_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Files ───────────────────────────────────────────────────────────────────
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_original VARCHAR(255) NOT NULL,
  nome_disco VARCHAR(255) NOT NULL UNIQUE,
  caminho TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  tamanho_bytes BIGINT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Orders ──────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id),
  address_id UUID REFERENCES addresses(id),
  kit_id UUID NOT NULL REFERENCES kits(id),
  produto_id UUID NOT NULL REFERENCES products(id),
  valor DECIMAL(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'aguardando_confirmacao',
  vendedor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cobrador_id UUID REFERENCES users(id) ON DELETE SET NULL,
  canal_id UUID REFERENCES whatsapp_channels(id) ON DELETE SET NULL,
  observacoes TEXT,
  motivo_frustracao TEXT,
  tentativas_entrega INT NOT NULL DEFAULT 0,
  rastreio_codigo VARCHAR(100),
  rastreio_transportadora VARCHAR(100),
  rastreio_url TEXT,
  superfrete_id VARCHAR(100),
  payt_link TEXT,
  pago_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMPTZ
);

CREATE INDEX idx_orders_codigo ON orders(codigo);
CREATE INDEX idx_orders_status ON orders(status) WHERE deletado_em IS NULL;
CREATE INDEX idx_orders_client ON orders(client_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_orders_vendedor ON orders(vendedor_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_orders_cobrador ON orders(cobrador_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_orders_criado_em ON orders(criado_em) WHERE deletado_em IS NULL;
CREATE INDEX idx_orders_rastreio ON orders(rastreio_codigo) WHERE rastreio_codigo IS NOT NULL;

-- ─── Order Tags ───────────────────────────────────────────────────────────────
CREATE TABLE order_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  cor VARCHAR(20),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, tag)
);

-- ─── Order History ───────────────────────────────────────────────────────────
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status_anterior order_status,
  status_novo order_status,
  descricao TEXT NOT NULL,
  metadata JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_history_order ON order_history(order_id);

-- ─── Order Notes ─────────────────────────────────────────────────────────────
CREATE TABLE order_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  texto TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Evidences ───────────────────────────────────────────────────────────────
CREATE TABLE evidences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tipo evidence_type NOT NULL,
  file_id UUID NOT NULL REFERENCES files(id),
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidences_order ON evidences(order_id);

-- ─── Shipments ───────────────────────────────────────────────────────────────
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  superfrete_id VARCHAR(100) UNIQUE,
  transportadora VARCHAR(100),
  servico VARCHAR(100),
  valor_frete DECIMAL(8,2),
  prazo_dias INT,
  status VARCHAR(50),
  etiqueta_url TEXT,
  etiqueta_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_superfrete ON shipments(superfrete_id) WHERE superfrete_id IS NOT NULL;

-- ─── Tracking Events ─────────────────────────────────────────────────────────
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  codigo_rastreio VARCHAR(100),
  status_anterior order_status,
  status_novo order_status,
  descricao TEXT NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL,
  local VARCHAR(200),
  transportadora VARCHAR(100),
  origem VARCHAR(50) NOT NULL DEFAULT 'webhook',
  hash_evento VARCHAR(64) UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracking_order ON tracking_events(order_id);
CREATE INDEX idx_tracking_rastreio ON tracking_events(codigo_rastreio) WHERE codigo_rastreio IS NOT NULL;

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  metodo payment_method,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  payt_id VARCHAR(100),
  payt_link TEXT,
  pago_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);

-- ─── Payment Receipts ─────────────────────────────────────────────────────────
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id),
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Traffic ─────────────────────────────────────────────────────────────────
CREATE TABLE traffic (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL,
  mes VARCHAR(7) NOT NULL,
  gasto DECIMAL(10,2) NOT NULL DEFAULT 0,
  leads INT NOT NULL DEFAULT 0,
  cpl DECIMAL(10,2),
  usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(data, usuario_id)
);

-- ─── Postback Configs ─────────────────────────────────────────────────────────
CREATE TABLE postback_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  eventos TEXT NOT NULL DEFAULT '[]',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  secret VARCHAR(255),
  headers TEXT DEFAULT '{}',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Postback Attempts ────────────────────────────────────────────────────────
CREATE TABLE postback_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_id UUID NOT NULL REFERENCES postback_configs(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  evento postback_event NOT NULL,
  payload TEXT NOT NULL,
  status_http INT,
  resposta TEXT,
  sucesso BOOLEAN NOT NULL DEFAULT FALSE,
  tentativa INT NOT NULL DEFAULT 1,
  proxima_tentativa TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_postback_attempts_config ON postback_attempts(config_id);
CREATE INDEX idx_postback_attempts_order ON postback_attempts(order_id);
CREATE INDEX idx_postback_attempts_pending ON postback_attempts(proxima_tentativa) 
  WHERE sucesso = FALSE AND proxima_tentativa IS NOT NULL;

-- ─── Webhook Logs ────────────────────────────────────────────────────────────
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origem VARCHAR(50) NOT NULL,
  headers TEXT,
  payload TEXT,
  processado BOOLEAN NOT NULL DEFAULT FALSE,
  erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_origem ON webhook_logs(origem);
CREATE INDEX idx_webhook_logs_criado ON webhook_logs(criado_em);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  acao VARCHAR(100) NOT NULL,
  tabela VARCHAR(100),
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip VARCHAR(45),
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_acao ON audit_logs(acao);
CREATE INDEX idx_audit_criado ON audit_logs(criado_em);

-- ─── Triggers: updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kits_updated_at BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_traffic_updated_at BEFORE UPDATE ON traffic
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_postback_configs_updated_at BEFORE UPDATE ON postback_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_postback_attempts_updated_at BEFORE UPDATE ON postback_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Migration Tracking ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  aplicado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO migrations (nome) VALUES ('001_initial_schema');

COMMIT;
