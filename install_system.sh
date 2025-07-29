#!/bin/bash

# Script de instalação do JáPede Cardápio
# Este script configura o ambiente, instala dependências e configura o sistema

set -e

# Cores para output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Função para exibir mensagens
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se o script está sendo executado como root
if [ "$(id -u)" -ne 0 ]; then
  log_error "Este script deve ser executado como root"
  exit 1
 fi

# Verificar sistema operacional
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$NAME
else
  log_error "Sistema operacional não suportado"
  exit 1
fi

log "Sistema operacional detectado: $OS"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
  log "Node.js não encontrado. Instalando..."
  
  # Instalar Node.js baseado no sistema operacional
  if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
  elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
  else
    log_error "Sistema operacional não suportado para instalação automática do Node.js"
    exit 1
  fi
  
  log_success "Node.js instalado com sucesso"
else
  NODE_VERSION=$(node -v)
  log "Node.js já está instalado: $NODE_VERSION"
  
  # Verificar versão do Node.js
  NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')
  if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    log_warning "A versão do Node.js é menor que 18. Recomendamos atualizar para a versão 18 ou superior."
  fi
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
  log_error "npm não encontrado. Verifique a instalação do Node.js"
  exit 1
fi

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null; then
  log "PM2 não encontrado. Instalando..."
  npm install -g pm2
  log_success "PM2 instalado com sucesso"
else
  log "PM2 já está instalado"
fi

# Verificar se o Nginx está instalado
if ! command -v nginx &> /dev/null; then
  log "Nginx não encontrado. Instalando..."
  
  # Instalar Nginx baseado no sistema operacional
  if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt-get update
    apt-get install -y nginx
  elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    yum install -y nginx
  else
    log_error "Sistema operacional não suportado para instalação automática do Nginx"
    exit 1
  fi
  
  log_success "Nginx instalado com sucesso"
else
  log "Nginx já está instalado"
fi

# Diretório da aplicação
APP_DIR="/opt/japede-cardapio"

# Criar diretório da aplicação se não existir
if [ ! -d "$APP_DIR" ]; then
  log "Criando diretório da aplicação: $APP_DIR"
  mkdir -p "$APP_DIR"
fi

# Copiar arquivos da aplicação
log "Copiando arquivos da aplicação para $APP_DIR"
cp -r ./* "$APP_DIR"/

# Configurar permissões
log "Configurando permissões"
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod +x "$APP_DIR/fix_package_json.sh"

# Corrigir o arquivo package.json para evitar erros de parsing
log "Corrigindo o arquivo package.json"
cd "$APP_DIR"
sed -i 's/\.\\install_windows\.ps1/\.\\\\install_windows\.ps1/g' package.json

# Instalar dependências
log "Instalando dependências da aplicação"
npm install --production

# Configurar variáveis de ambiente
if [ ! -f "$APP_DIR/.env.local" ]; then
  log "Criando arquivo .env.local"
  cat > "$APP_DIR/.env.local" << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://157.180.134.78:8083
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Production Environment
NODE_ENV=production
VITE_NODE_ENV=production

# App Configuration
VITE_APP_TITLE=JáPede Cardápio
EOL
  log_success "Arquivo .env.local criado"
else
  log "Arquivo .env.local já existe"
fi

# Construir a aplicação
log "Construindo a aplicação"
npm run build

# Inicializar o banco de dados
log "Inicializando o banco de dados"
node init_database.js

# Configurar o Nginx
log "Configurando o Nginx"
NGINX_CONF="/etc/nginx/sites-available/japede-cardapio"
NGINX_ENABLED="/etc/nginx/sites-enabled/japede-cardapio"

# Criar configuração do Nginx
cat > "$NGINX_CONF" << EOL
server {
    listen 80;
    server_name _;

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Configurações de compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/xml application/json;
    gzip_disable "MSIE [1-6]\.";

    # Configurações de cache para arquivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root $APP_DIR/dist;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files \$uri =404;
    }

    # Configuração para o frontend (React)
    location / {
        root $APP_DIR/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Configuração para o backend (Express)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Configurações de erro
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOL

# Habilitar o site
if [ -f "$NGINX_ENABLED" ]; then
  rm "$NGINX_ENABLED"
fi
ln -s "$NGINX_CONF" "$NGINX_ENABLED"

# Verificar configuração do Nginx
nginx -t

# Reiniciar o Nginx
systemctl restart nginx

# Iniciar a aplicação com PM2
log "Iniciando a aplicação com PM2"
cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

log_success "Instalação concluída com sucesso!"
log "A aplicação está disponível em: http://localhost"