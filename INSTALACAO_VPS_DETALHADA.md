# Instruções Detalhadas para Instalação no VPS

Este documento fornece instruções detalhadas para instalar o JáPede Cardápio em um servidor VPS, complementando os scripts automatizados fornecidos.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Servidor](#preparação-do-servidor)
3. [Instalação do Supabase](#instalação-do-supabase)
4. [Instalação da Aplicação](#instalação-da-aplicação)
5. [Configuração do Nginx](#configuração-do-nginx)
6. [Configuração do PM2](#configuração-do-pm2)
7. [Configuração do Firewall](#configuração-do-firewall)
8. [Manutenção](#manutenção)
9. [Solução de Problemas](#solução-de-problemas)

## Pré-requisitos

Antes de iniciar a instalação, você precisará:

- Um servidor VPS com Ubuntu 20.04 ou superior
- Acesso root ao servidor
- Um domínio apontando para o IP do servidor (opcional, mas recomendado)
- As seguintes informações para o Supabase:
  - `SUPABASE_ANON_KEY`: Chave anônima do Supabase
  - `SUPABASE_SERVICE_KEY`: Chave de serviço do Supabase
  - `POSTGRES_PASSWORD`: Senha para o banco de dados PostgreSQL
  - `JWT_SECRET`: Segredo para geração de tokens JWT
  - `DASHBOARD_USERNAME`: Nome de usuário para o dashboard do Supabase
  - `DASHBOARD_PASSWORD`: Senha para o dashboard do Supabase
  - `SECRET_KEY_BASE`: Chave secreta para o Supabase
  - `VAULT_ENC_KEY`: Chave de encriptação para o vault do Supabase

## Preparação do Servidor

### 1. Atualizar o Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Instalar Dependências Básicas

```bash
sudo apt install -y curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 3. Instalar Node.js

```bash
# Remover versões antigas do Node.js se existirem
sudo apt remove -y nodejs npm || true

# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version

# Atualizar npm para a versão mais recente
sudo npm install -g npm@latest
```

### 4. Instalar Nginx

```bash
sudo apt install -y nginx

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

## Instalação do Supabase

Existem duas opções para instalar o Supabase: usando o EasyPanel ou instalando diretamente no servidor.

### Opção 1: Instalação via EasyPanel

Se você estiver usando o EasyPanel, siga estas etapas:

1. Acesse o painel do EasyPanel
2. Crie uma nova aplicação Supabase com as seguintes variáveis:
   - `POSTGRES_PASSWORD`: Senha para o PostgreSQL
   - `JWT_SECRET`: Segredo para geração de tokens JWT
   - `ANON_KEY`: Chave anônima do Supabase
   - `SERVICE_ROLE_KEY`: Chave de serviço do Supabase
   - `DASHBOARD_USERNAME`: Nome de usuário para o dashboard
   - `DASHBOARD_PASSWORD`: Senha para o dashboard
   - `SECRET_KEY_BASE`: Chave secreta
   - `VAULT_ENC_KEY`: Chave de encriptação para o vault
3. Configure a porta 8083 para acesso externo

### Opção 2: Instalação Direta do Supabase

Para instalar o Supabase diretamente no servidor, você pode usar o Docker Compose:

```bash
# Instalar Docker
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Clonar o repositório do Supabase
git clone https://github.com/supabase/supabase
cd supabase/docker

# Configurar variáveis de ambiente
cp .env.example .env

# Editar o arquivo .env com suas configurações
nano .env

# Iniciar o Supabase
docker-compose up -d
```

## Instalação da Aplicação

### 1. Clonar o Repositório

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/seu-usuario/japede-cardapio.git
cd japede-cardapio
```

### 2. Configurar Variáveis de Ambiente

```bash
sudo cp .env.example .env.local
sudo nano .env.local
```

Edite o arquivo `.env.local` com as seguintes informações:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://seu-ip:8083
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico

# Environment
NODE_ENV=production
VITE_NODE_ENV=production

# App Configuration
VITE_APP_TITLE=JáPede Cardápio
```

### 3. Instalar Dependências e Construir a Aplicação

```bash
sudo npm ci --production=false
sudo npm run build
```

### 4. Configurar o Banco de Dados

Use o script de configuração do banco de dados:

```bash
sudo chmod +x ./configure_supabase.sh
sudo ./configure_supabase.sh http://localhost:8083 sua-chave-de-servico
```

Ou execute manualmente os arquivos SQL:

```bash
# Instalar cliente PostgreSQL
sudo apt install -y postgresql-client

# Executar schema e dados iniciais
psql -h localhost -p 5432 -U postgres -d postgres -f supabase_schema.sql
psql -h localhost -p 5432 -U postgres -d postgres -f supabase_seed_data.sql
```

## Configuração do Nginx

### 1. Criar Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/japede-cardapio
```

Adicione a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com; # Ou seu endereço IP
    
    root /var/www/japede-cardapio/dist;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/japede-cardapio.access.log;
    error_log /var/log/nginx/japede-cardapio.error.log;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: https: blob:; font-src 'self' data:;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache control for HTML files
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
        access_log off;
        
        # Handle missing files gracefully
        try_files $uri =404;
    }
    
    # API proxy para o servidor Express
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Deny access to sensitive files
    location ~ /\.(ht|env|git) {
        deny all;
        return 404;
    }
}
```

### 2. Ativar o Site

```bash
sudo ln -sf /etc/nginx/sites-available/japede-cardapio /etc/nginx/sites-enabled/japede-cardapio
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## Configuração do PM2

### 1. Instalar PM2

```bash
sudo npm install -g pm2
```

### 2. Iniciar a Aplicação com PM2

```bash
cd /var/www/japede-cardapio
sudo pm2 start ecosystem.config.js

# Salvar configuração do PM2
sudo pm2 save

# Configurar PM2 para iniciar no boot
sudo pm2 startup
```

## Configuração do Firewall

```bash
# Instalar ufw se não estiver instalado
sudo apt install -y ufw

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (importante!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir porta do Supabase (se necessário)
sudo ufw allow 8083/tcp

# Ativar firewall
sudo ufw --force enable

# Verificar status
sudo ufw status
```

## Manutenção

### Scripts de Utilitários

Os seguintes scripts são criados automaticamente pelo script de instalação:

- **Status**: `/var/www/japede-cardapio/status.sh`
  - Mostra o status atual da aplicação, Nginx, PM2, espaço em disco e memória

- **Atualização**: `/var/www/japede-cardapio/update.sh`
  - Atualiza a aplicação para a versão mais recente do repositório

- **Backup**: `/var/www/japede-cardapio/backup.sh`
  - Cria um backup da aplicação e configurações

### Comandos Úteis

```bash
# Verificar logs do Nginx
sudo tail -f /var/log/nginx/japede-cardapio.error.log

# Verificar logs da aplicação
sudo pm2 logs

# Reiniciar aplicação
sudo pm2 restart japede-cardapio

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar status do sistema
sudo systemctl status nginx
sudo pm2 status
```

## Solução de Problemas

### Problema: A aplicação não está acessível no navegador

**Verificações:**

1. Verifique se o Nginx está rodando:
   ```bash
   sudo systemctl status nginx
   ```

2. Verifique se a aplicação está rodando no PM2:
   ```bash
   sudo pm2 status
   ```

3. Verifique os logs do Nginx:
   ```bash
   sudo tail -f /var/log/nginx/japede-cardapio.error.log
   ```

4. Verifique os logs da aplicação:
   ```bash
   sudo pm2 logs japede-cardapio
   ```

5. Verifique se o firewall está permitindo conexões:
   ```bash
   sudo ufw status
   ```

### Problema: Erro ao conectar com o Supabase

**Verificações:**

1. Verifique se o Supabase está rodando:
   ```bash
   # Se instalado via Docker
   sudo docker ps | grep supabase
   
   # Se instalado via EasyPanel
   # Verifique no painel do EasyPanel
   ```

2. Verifique se as variáveis de ambiente estão corretas:
   ```bash
   cat /var/www/japede-cardapio/.env.local
   ```

3. Teste a conexão com o Supabase:
   ```bash
   curl -s -H "apikey: sua-chave-anonima" http://localhost:8083/rest/v1/
   ```

### Problema: Erro ao inicializar o banco de dados

**Verificações:**

1. Verifique se os arquivos SQL existem:
   ```bash
   ls -la /var/www/japede-cardapio/supabase_schema.sql
   ls -la /var/www/japede-cardapio/supabase_seed_data.sql
   ```

2. Tente executar os arquivos SQL manualmente:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres -f /var/www/japede-cardapio/supabase_schema.sql
   ```

3. Verifique os logs do PostgreSQL:
   ```bash
   # Se instalado via Docker
   sudo docker logs supabase_db_1
   ```

---

Este guia detalhado complementa os scripts automatizados fornecidos. Se você encontrar problemas específicos não cobertos aqui, consulte a documentação oficial do Node.js, Nginx, PM2 ou Supabase, ou abra uma issue no repositório do projeto.