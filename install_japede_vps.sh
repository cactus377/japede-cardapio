#!/bin/bash

# 🍕 Script de Instalação Corrigido - JáPede Cardápio VPS
# Versão: 2.0 - Corrigida e Otimizada
# Compatível com: Ubuntu 20.04+ / Debian 11+

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Funções de log melhoradas
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Verificar se está executando como root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script deve ser executado como root"
        log_info "Execute: sudo bash $0"
        exit 1
    fi
}

# Detectar sistema operacional
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        log_info "Sistema detectado: $OS $VER"
    else
        log_error "Não foi possível detectar o sistema operacional"
        exit 1
    fi
}

# Solicitar informações do usuário com validação
get_user_input() {
    log_step "=== Configuração da Instalação ==="
    
    # Domínio ou IP
    while true; do
        read -p "Domínio ou IP do servidor (ex: meusite.com ou 157.180.78.134): " DOMAIN
        if [[ -n "$DOMAIN" ]]; then
            break
        fi
        log_warning "Domínio/IP é obrigatório"
    done
    
    # URL do Supabase
    while true; do
        read -p "URL do Supabase (ex: https://abc.supabase.co): " SUPABASE_URL
        if [[ "$SUPABASE_URL" =~ ^https?:// ]]; then
            break
        fi
        log_warning "URL deve começar com http:// ou https://"
    done
    
    # Chave anônima do Supabase
    while true; do
        read -p "Chave anônima do Supabase: " SUPABASE_ANON_KEY
        if [[ -n "$SUPABASE_ANON_KEY" ]]; then
            break
        fi
        log_warning "Chave anônima é obrigatória"
    done
    
    # Chave de serviço (opcional)
    read -p "Chave de serviço do Supabase (opcional, para configuração automática do DB): " SUPABASE_SERVICE_KEY
    
    # Repositório Git
    read -p "URL do repositório Git [https://github.com/Mails7/japede-cardapio.git]: " GIT_REPO
    GIT_REPO=${GIT_REPO:-"https://github.com/Mails7/japede-cardapio.git"}
    
    # Diretório de instalação
    read -p "Diretório de instalação [/var/www/japede-cardapio]: " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-"/var/www/japede-cardapio"}
    
    # Configurar SSL
    if [[ "$DOMAIN" != *"."* ]] || [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        SETUP_SSL="false"
        log_info "SSL será desabilitado (IP ou domínio local detectado)"
    else
        read -p "Configurar SSL com Let's Encrypt? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            SETUP_SSL="true"
            read -p "Email para certificado SSL: " SSL_EMAIL
        else
            SETUP_SSL="false"
        fi
    fi
    
    echo
    log_info "=== Resumo da Configuração ==="
    log_info "  Domínio/IP: $DOMAIN"
    log_info "  Supabase URL: $SUPABASE_URL"
    log_info "  Repositório: $GIT_REPO"
    log_info "  Diretório: $INSTALL_DIR"
    log_info "  SSL: $SETUP_SSL"
    echo
    
    read -p "Continuar com essa configuração? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Instalação cancelada pelo usuário"
        exit 1
    fi
}

# Atualizar sistema
update_system() {
    log_step "Atualizando sistema..."
    
    export DEBIAN_FRONTEND=noninteractive
    
    apt update
    apt upgrade -y
    
    # Instalar dependências básicas
    apt install -y curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    log_success "Sistema atualizado"
}

# Instalar Node.js via NodeSource
install_nodejs() {
    log_step "Instalando Node.js LTS..."
    
    # Remover versões antigas do Node.js se existirem
    apt remove -y nodejs npm || true
    
    # Adicionar repositório NodeSource
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    
    # Instalar Node.js
    apt install -y nodejs
    
    # Verificar instalação
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log_info "Node.js instalado: $NODE_VERSION"
    log_info "NPM instalado: $NPM_VERSION"
    
    # Atualizar npm para a versão mais recente
    npm install -g npm@latest
    
    log_success "Node.js configurado"
}

# Instalar Nginx
install_nginx() {
    log_step "Instalando e configurando Nginx..."
    
    apt install -y nginx
    
    # Iniciar e habilitar Nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Verificar se está rodando
    if systemctl is-active --quiet nginx; then
        log_success "Nginx instalado e rodando"
    else
        log_error "Falha ao iniciar Nginx"
        exit 1
    fi
}

# Configurar firewall
setup_firewall() {
    log_step "Configurando firewall..."
    
    # Instalar ufw se não estiver instalado
    apt install -y ufw
    
    # Configurar regras básicas
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Permitir SSH (importante!)
    ufw allow ssh
    ufw allow 22/tcp
    
    # Permitir HTTP e HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Ativar firewall
    ufw --force enable
    
    log_success "Firewall configurado"
}

# Clonar e configurar projeto
setup_project() {
    log_step "Configurando projeto..."
    
    # Criar diretório pai se não existir
    mkdir -p "$(dirname "$INSTALL_DIR")"
    
    # Remover diretório existente se houver
    if [[ -d "$INSTALL_DIR" ]]; then
        log_warning "Diretório existente encontrado. Fazendo backup..."
        mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%s)"
    fi
    
    # Clonar repositório
    log_info "Clonando repositório: $GIT_REPO"
    git clone "$GIT_REPO" "$INSTALL_DIR"
    
    cd "$INSTALL_DIR"
    
    # Verificar se é um projeto Node.js válido
    if [[ ! -f "package.json" ]]; then
        log_error "package.json não encontrado. Verifique se o repositório está correto."
        exit 1
    fi
    
    # Instalar dependências
    log_info "Instalando dependências do projeto..."
    npm ci --production=false
    
    # Configurar variáveis de ambiente
    log_info "Configurando variáveis de ambiente..."
    cat > .env.local << EOF
# Configuração de Produção - JáPede Cardápio
# Gerado automaticamente em $(date)

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Production Environment
NODE_ENV=production
VITE_NODE_ENV=production

# App Configuration
VITE_APP_TITLE=JáPede Cardápio
VITE_APP_DOMAIN=$DOMAIN
EOF
    
    # Fazer build da aplicação
    log_info "Fazendo build da aplicação..."
    npm run build
    
    # Verificar se o build foi criado
    if [[ ! -d "dist" ]]; then
        log_error "Diretório 'dist' não foi criado. Verifique se o build foi bem-sucedido."
        exit 1
    fi
    
    # Configurar permissões
    chown -R www-data:www-data "$INSTALL_DIR"
    chmod -R 755 "$INSTALL_DIR"
    
    log_success "Projeto configurado"
}

# Configurar Nginx para o projeto
setup_nginx_config() {
    log_step "Configurando Nginx para o projeto..."
    
    # Backup da configuração padrão
    if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
        mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
    fi
    
    # Criar configuração do site
    cat > "/etc/nginx/sites-available/japede-cardapio" << EOF
# Configuração Nginx - JáPede Cardápio
# Gerado automaticamente em $(date)

server {
    listen 80;
    server_name $DOMAIN;
    
    root $INSTALL_DIR/dist;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/japede-cardapio.access.log;
    error_log /var/log/nginx/japede-cardapio.error.log;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: https: blob:; font-src 'self' data: https:;" always;
    
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
        try_files \$uri \$uri/ /index.html;
        
        # Cache control for HTML files
        location ~* \.html\$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)\$ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
        access_log off;
        
        # Handle missing files gracefully
        try_files \$uri =404;
    }
    
    # API proxy para Supabase (se necessário)
    location /api/ {
        proxy_pass $SUPABASE_URL/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Deny access to sensitive files
    location ~ /\.(ht|env|git) {
        deny all;
        return 404;
    }
    
    # Deny access to backup files
    location ~ \.(bak|backup|old|tmp)\$ {
        deny all;
        return 404;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Ativar site
    ln -sf "/etc/nginx/sites-available/japede-cardapio" "/etc/nginx/sites-enabled/japede-cardapio"
    
    # Testar configuração
    if nginx -t; then
        systemctl reload nginx
        log_success "Nginx configurado para o projeto"
    else
        log_error "Erro na configuração do Nginx"
        cat /var/log/nginx/error.log | tail -10
        exit 1
    fi
}

# Configurar SSL com Let's Encrypt
setup_ssl() {
    if [[ "$SETUP_SSL" == "true" ]]; then
        log_step "Configurando SSL com Let's Encrypt..."
        
        # Instalar Certbot
        apt install -y certbot python3-certbot-nginx
        
        # Aguardar DNS propagar
        log_info "Aguardando DNS propagar... (30 segundos)"
        sleep 30
        
        # Obter certificado SSL
        if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect; then
            log_success "SSL configurado com sucesso"
            
            # Configurar renovação automática
            (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
            log_success "Renovação automática de SSL configurada"
        else
            log_warning "Falha ao configurar SSL. Site funcionará apenas com HTTP."
            log_warning "Verifique se o DNS está apontando corretamente para este servidor."
        fi
    else
        log_info "SSL não será configurado"
    fi
}

# Configurar banco de dados
setup_database() {
    log_step "Configurando banco de dados..."
    
    cd "$INSTALL_DIR"
    
    if [[ -f "supabase_schema.sql" ]] && [[ -n "$SUPABASE_SERVICE_KEY" ]]; then
        log_info "Tentando configurar banco automaticamente..."
        
        # Instalar psql para executar SQL
        apt install -y postgresql-client
        
        # Tentar executar schema
        if [[ -n "$SUPABASE_SERVICE_KEY" ]]; then
            log_info "Executando schema do banco..."
            
            # Criar script temporário para executar SQL
            cat > temp_setup_db.sh << 'EOF'
#!/bin/bash
# Script temporário para configuração do banco

SUPABASE_URL="$1"
SERVICE_KEY="$2"
SCHEMA_FILE="$3"

# Função para executar SQL via API
execute_sql() {
    local sql_content="$1"
    
    curl -s -X POST \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: application/json" \
        "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -d "{\"sql\":\"$sql_content\"}"
}

# Ler e executar schema
if [[ -f "$SCHEMA_FILE" ]]; then
    echo "Executando schema..."
    SQL_CONTENT=$(cat "$SCHEMA_FILE" | tr '\n' ' ' | sed 's/"/\\"/g')
    execute_sql "$SQL_CONTENT"
    echo "Schema executado"
else
    echo "Arquivo de schema não encontrado: $SCHEMA_FILE"
fi
EOF
            
            chmod +x temp_setup_db.sh
            ./temp_setup_db.sh "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY" "supabase_schema.sql"
            rm temp_setup_db.sh
            
            log_success "Configuração do banco concluída"
        fi
    else
        log_warning "Configuração automática do banco não disponível"
        log_info "Configure manualmente:"
        log_info "  1. Acesse seu painel do Supabase"
        log_info "  2. Execute o arquivo: $INSTALL_DIR/supabase_schema.sql"
        log_info "  3. Execute o arquivo: $INSTALL_DIR/supabase_seed_data.sql (opcional)"
    fi
}

# Criar scripts de utilitários
create_utility_scripts() {
    log_step "Criando scripts de utilitários..."
    
    # Script de atualização
    cat > "$INSTALL_DIR/update.sh" << 'EOF'
#!/bin/bash
# Script de atualização do JáPede Cardápio

set -e

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

cd "$(dirname "$0")"

log_info "Atualizando aplicação JáPede Cardápio..."

# Fazer backup
log_info "Fazendo backup da versão atual..."
cp -r dist dist.backup.$(date +%s) 2>/dev/null || true

# Pull do repositório
if [[ -d ".git" ]]; then
    log_info "Atualizando código do repositório..."
    git pull origin main
else
    log_error "Não é um repositório Git. Atualização manual necessária."
    exit 1
fi

# Instalar/atualizar dependências
log_info "Atualizando dependências..."
npm ci --production=false

# Build
log_info "Fazendo build da aplicação..."
npm run build

# Verificar se build foi bem-sucedido
if [[ ! -d "dist" ]]; then
    log_error "Build falhou. Restaurando backup..."
    if [[ -d "dist.backup.$(ls -t | grep dist.backup | head -1 | cut -d. -f3)" ]]; then
        mv dist.backup.* dist
    fi
    exit 1
fi

# Configurar permissões
chown -R www-data:www-data .
chmod -R 755 .

# Recarregar Nginx
log_info "Recarregando Nginx..."
sudo systemctl reload nginx

# Limpar backups antigos (manter apenas os 3 mais recentes)
ls -t | grep "dist.backup" | tail -n +4 | xargs rm -rf 2>/dev/null || true

log_success "Aplicação atualizada com sucesso!"
log_info "Acesse: http://$(hostname -I | awk '{print $1}') ou seu domínio configurado"
EOF
    
    # Script de backup
    cat > "$INSTALL_DIR/backup.sh" << EOF
#!/bin/bash
# Script de backup do JáPede Cardápio

set -e

BACKUP_DIR="/var/backups/japede-cardapio"
DATE=\$(date +%Y%m%d_%H%M%S)
INSTALL_DIR="$INSTALL_DIR"

# Criar diretório de backup
mkdir -p "\$BACKUP_DIR"

echo "Fazendo backup da aplicação JáPede Cardápio..."

# Backup dos arquivos
tar -czf "\$BACKUP_DIR/japede-cardapio_\$DATE.tar.gz" -C "\$(dirname "\$INSTALL_DIR")" "\$(basename "\$INSTALL_DIR")"

# Backup da configuração do Nginx
cp /etc/nginx/sites-available/japede-cardapio "\$BACKUP_DIR/nginx_\$DATE.conf" 2>/dev/null || true

echo "Backup salvo em: \$BACKUP_DIR/japede-cardapio_\$DATE.tar.gz"

# Manter apenas os 5 backups mais recentes
ls -t "\$BACKUP_DIR"/japede-cardapio_*.tar.gz | tail -n +6 | xargs -r rm

echo "Backup concluído!"
EOF
    
    # Script de status
    cat > "$INSTALL_DIR/status.sh" << 'EOF'
#!/bin/bash
# Script de status do JáPede Cardápio

echo "=== Status do JáPede Cardápio ==="
echo

# Status do Nginx
echo "Nginx:"
if systemctl is-active --quiet nginx; then
    echo "  ✅ Rodando"
else
    echo "  ❌ Parado"
fi

# Status do site
echo
echo "Site:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    echo "  ✅ Acessível"
else
    echo "  ❌ Inacessível"
fi

# Espaço em disco
echo
echo "Espaço em disco:"
df -h / | tail -1 | awk '{print "  Usado: " $3 " / " $2 " (" $5 ")"}'

# Memória
echo
echo "Memória:"
free -h | grep "Mem:" | awk '{print "  Usado: " $3 " / " $2}'

# Logs recentes
echo
echo "Logs recentes do Nginx (últimas 5 linhas):"
tail -5 /var/log/nginx/japede-cardapio.error.log 2>/dev/null || echo "  Nenhum erro recente"

echo
echo "=== Fim do Status ==="
EOF
    
    # Tornar scripts executáveis
    chmod +x "$INSTALL_DIR/update.sh"
    chmod +x "$INSTALL_DIR/backup.sh"
    chmod +x "$INSTALL_DIR/status.sh"
    
    log_success "Scripts de utilitários criados"
}

# Verificar instalação
verify_installation() {
    log_step "Verificando instalação..."
    
    # Verificar se Nginx está rodando
    if ! systemctl is-active --quiet nginx; then
        log_error "Nginx não está rodando"
        return 1
    fi
    
    # Verificar se o site está acessível
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost" | grep -q "200"; then
        log_success "Site está acessível localmente"
    else
        log_warning "Site pode não estar acessível. Verifique a configuração."
    fi
    
    # Verificar arquivos importantes
    local important_files=("$INSTALL_DIR/dist/index.html" "$INSTALL_DIR/.env.local")
    for file in "${important_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "Arquivo encontrado: $file"
        else
            log_error "Arquivo não encontrado: $file"
            return 1
        fi
    done
    
    log_success "Verificação concluída"
}

# Função principal
main() {
    echo -e "${PURPLE}"
    echo "🍕 =================================="
    echo "   JáPede Cardápio - Instalador VPS"
    echo "   Versão 2.0 - Corrigida"
    echo "==================================="
    echo -e "${NC}"
    
    check_root
    detect_os
    get_user_input
    
    log_step "=== Iniciando Instalação ==="
    
    update_system
    install_nodejs
    install_nginx
    setup_firewall
    setup_project
    setup_nginx_config
    setup_ssl
    setup_database
    create_utility_scripts
    verify_installation
    
    echo
    echo -e "${GREEN}🎉 =================================="
    echo "   Instalação Concluída com Sucesso!"
    echo "===================================${NC}"
    echo
    
    log_info "URLs de acesso:"
    if [[ "$SETUP_SSL" == "true" ]]; then
        log_info "  🔒 HTTPS: https://$DOMAIN"
        log_info "  🔓 HTTP:  http://$DOMAIN (redirecionará para HTTPS)"
    else
        log_info "  🔓 HTTP:  http://$DOMAIN"
    fi
    
    echo
    log_info "Scripts úteis criados em $INSTALL_DIR:"
    log_info "  📄 Status:     ./status.sh"
    log_info "  🔄 Atualizar:  ./update.sh"
    log_info "  💾 Backup:     ./backup.sh"
    
    echo
    log_info "Comandos úteis:"
    log_info "  Status Nginx:     systemctl status nginx"
    log_info "  Logs do site:     tail -f /var/log/nginx/japede-cardapio.error.log"
    log_info "  Recarregar Nginx: systemctl reload nginx"
    
    echo
    log_warning "Próximos passos importantes:"
    log_warning "  1. 🌐 Configure DNS para apontar $DOMAIN para este servidor"
    log_warning "  2. 🗄️  Verifique se o Supabase está configurado corretamente"
    log_warning "  3. 🔐 Configure permissões RLS no Supabase se necessário"
    log_warning "  4. 🧪 Teste todas as funcionalidades do sistema"
    log_warning "  5. 📊 Execute: $INSTALL_DIR/status.sh para verificar status"
    
    echo
    log_success "🚀 JáPede Cardápio instalado e pronto para uso!"
    
    # Mostrar IP do servidor
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if [[ -n "$SERVER_IP" ]]; then
        echo
        log_info "IP do servidor: $SERVER_IP"
        if [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            log_info "Acesse temporariamente: http://$SERVER_IP"
        fi
    fi
}

# Executar função principal
main "$@"

