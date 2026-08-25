# QUATTRO Logística — Sistema de Gerenciamento

Sistema completo de gerenciamento logístico no modelo **Afterpay** (envio antes do pagamento), com rastreamento automático, Kanban, integrações com SuperFrete e Payt, dashboard analítico e sistema de postbacks.

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### 1. Clone e Configure

```bash
cd quattro-logistica

# Backend
cd backend
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Frontend
cd ../frontend
# Nenhuma configuração adicional necessária para desenvolvimento
```

### 2. Banco de Dados

```bash
# Crie o banco
createdb quattro_logistica

# Ou via psql:
psql -U postgres -c "CREATE DATABASE quattro_logistica;"
psql -U postgres -c "CREATE USER quattro_user WITH PASSWORD 'sua_senha';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE quattro_logistica TO quattro_user;"

# Configure no .env:
DATABASE_URL=postgresql://quattro_user:sua_senha@localhost:5432/quattro_logistica
```

### 3. Instale e Execute

```bash
# Backend
cd backend
npm install
npm run migrate    # Executa as migrações
npm run seed       # Cria admin + produtos iniciais
npm run dev        # Inicia em modo desenvolvimento

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

### 4. Acesse o Sistema

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health check**: http://localhost:3001/health

### 5. Login Inicial

| Campo | Valor |
|-------|-------|
| E-mail | `QUATTRO@gmail.com` |
| Senha | `Quattro123@` |
| Função | Administrador |

> ⚠️ **Altere a senha imediatamente após o primeiro login!**

---

## 🔧 Configuração das Integrações

### CPF API
```env
CPF_API_BASE_URL=https://base4.sistemafullativo.online:81/api/cpf-cnpj
CPF_API_TOKEN=118D0C595D
```

### CEP API
```env
CEP_API_BASE_URL=https://base2.sistemafullativo.online:80/api/cep1
VIACEP_FALLBACK=true
```

### SuperFrete
1. Acesse https://superfrete.com e crie uma conta
2. Gere um token de API no painel
3. Configure no `.env`:
```env
SUPERFRETE_API_URL=https://superfrete.com/api/v0
SUPERFRETE_API_TOKEN=seu_token_aqui
SUPERFRETE_WEBHOOK_SECRET=seu_secret_aqui
```
4. Configure o webhook no painel SuperFrete:
   - URL: `https://seudominio.com.br/webhooks/superfrete`
   - Eventos: todos

### Payt
1. Acesse https://payt.com.br e crie uma conta
2. Configure no `.env`:
```env
PAYT_API_URL=https://api.payt.com.br/v1
PAYT_API_TOKEN=seu_token_aqui
PAYT_WEBHOOK_SECRET=seu_secret_aqui
```
3. Configure o webhook no painel Payt:
   - URL: `https://seudominio.com.br/webhooks/payt`
   - Evento: `payment.approved`

### E-mail (Gmail)
1. Crie uma senha de aplicativo no Google: https://myaccount.google.com/apppasswords
2. Configure no `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu@gmail.com
EMAIL_PASSWORD=sua_senha_de_app
```

---

## 👥 Como Criar Usuários

1. Acesse o sistema como **Administrador**
2. Vá em **Equipe → Equipe**
3. Clique em **+ Adicionar Membro**
4. Preencha: Nome, E-mail, Função
5. O sistema gerará uma senha provisória
6. O usuário receberá e-mail com as credenciais (se e-mail configurado)

### Funções disponíveis:
| Função | Acesso |
|--------|--------|
| Administrador | Completo |
| Gestor | Pedidos, clientes, equipe, dashboard, tráfego |
| Vendedor | Criar e consultar próprios pedidos |
| Logística | Confirmar, enviar, rastrear |
| Cobrador | Pedidos entregues, cobranças |
| Visualizador | Somente leitura |

---

## 📦 Produtos e Kits

### Cadastrados automaticamente pelo seed:

| Kit | Quantidade | Preço | Badge |
|-----|-----------|-------|-------|
| Kit com 2 sprays | 2 | R$ 347,00 | — |
| Kit com 3 sprays | 3 | R$ 497,00 | MAIS ESCOLHIDO |
| Kit com 6 sprays | 6 | R$ 797,00 | MELHOR OFERTA |

### Configurar pesos e dimensões:
1. Acesse **Ferramentas → Produtos e Kits**
2. Clique em **Editar** no kit desejado
3. Atualize: Peso (kg), Altura, Largura, Comprimento (cm)
4. Estes valores são usados na cotação da SuperFrete

### Configurar links Payt:
1. Acesse **Perfil** (canto inferior esquerdo)
2. Na seção **Recebimento**, cadastre:
   - Link Payt de R$ 347
   - Link Payt de R$ 497
   - Link Payt de R$ 797
3. Clique **Salvar**

---

## 🔗 URLs dos Webhooks

| Integração | URL |
|-----------|-----|
| SuperFrete | `https://seudominio.com.br/webhooks/superfrete` |
| Payt | `https://seudominio.com.br/webhooks/payt` |

---

## 📊 Como Testar Integrações

1. Acesse **Ferramentas → Integrações**
2. Cada integração mostra: status, token configurado (mascarado), último teste
3. Clique em **Testar Conexão** para verificar
4. Se "Aguardando Credenciais", configure o token no `.env`

---

## 🚀 Deploy em Produção

### Ubuntu 22.04 + Nginx + PM2

```bash
# 1. Instale Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instale PM2
npm install -g pm2

# 3. Build backend
cd backend
npm install
npm run build
npm run migrate
npm run seed

# 4. Build frontend
cd ../frontend
npm install
npm run build
# Os arquivos estão em frontend/dist/

# 5. Configure PM2
pm2 start dist/app.js --name "quattro-backend" --env production
pm2 save
pm2 startup

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/quattro
```

**Configuração Nginx:**
```nginx
server {
    server_name seudominio.com.br;

    # Frontend (arquivos estáticos)
    location / {
        root /var/www/quattro/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    # Webhooks
    location /webhooks {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    # Certbot will add SSL config here
}
```

```bash
# 7. SSL com Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br
```

---

## 💾 Backup e Restauração

### Backup do banco:
```bash
# Backup completo
pg_dump -U quattro_user -h localhost quattro_logistica > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
pg_dump -U quattro_user quattro_logistica | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restauração:
```bash
# Restaurar SQL
psql -U quattro_user -d quattro_logistica < backup_20260825.sql

# Restaurar comprimido
gunzip -c backup_20260825.sql.gz | psql -U quattro_user -d quattro_logistica
```

### Backup automático (crontab):
```bash
# Adicione ao crontab: crontab -e
0 2 * * * pg_dump -U quattro_user quattro_logistica | gzip > /var/backups/quattro/backup_$(date +\%Y\%m\%d).sql.gz
# Manter últimos 30 dias
0 3 * * * find /var/backups/quattro/ -name "*.sql.gz" -mtime +30 -delete
```

### Backup dos arquivos:
```bash
# Backup da pasta uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /path/to/quattro-logistica/backend/uploads/
```

---

## 🔑 Como Trocar Tokens

1. Edite o arquivo `.env` no servidor
2. Atualize o token correspondente
3. Reinicie o backend: `pm2 restart quattro-backend`
4. Teste em **Ferramentas → Integrações**

> **Nunca versione o arquivo `.env` com tokens reais!**

---

## 🔒 Variáveis de Ambiente — Referência Completa

Veja `.env.example` para todas as variáveis disponíveis.

### Gerar secrets seguros:
```bash
# SESSION_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# POSTBACK_SIGNING_SECRET (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📁 Estrutura de Arquivos

```
quattro-logistica/
├── backend/
│   ├── src/           # Código fonte TypeScript
│   ├── dist/          # Build compilado (gerado pelo npm run build)
│   ├── uploads/       # Arquivos enviados pelos usuários (privado)
│   ├── logs/          # Logs da aplicação
│   └── .env           # Variáveis de ambiente (NÃO versionar)
│
└── frontend/
    ├── src/           # Código fonte React
    ├── dist/          # Build compilado (gerado pelo npm run build)
    └── public/        # Arquivos públicos (favicon, logo)
```

---

## 🐛 Troubleshooting

**Erro de conexão com banco:**
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql status
# Testar conexão
psql $DATABASE_URL -c "SELECT 1;"
```

**Backend não inicia:**
```bash
pm2 logs quattro-backend
# Verificar variáveis de ambiente
cat .env | grep -v "^#"
```

**Integração SuperFrete com erro:**
- Verifique se o token está correto em Ferramentas → Integrações
- Teste a conexão
- Verifique os logs: `pm2 logs quattro-backend | grep SuperFrete`

---

## 📞 Suporte

Sistema desenvolvido para QUATTRO Logística.
Documentação de integrações: veja `/ferramentas/integracoes` no sistema.
