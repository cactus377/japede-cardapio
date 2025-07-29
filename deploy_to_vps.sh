#!/bin/bash

# Script de Instalação do JáPede Cardápio no VPS EasyPanel
# Criado especificamente para o VPS 157.180.78.134

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Funções de log
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
    echo -e "\n${PURPLE}[STEP]${NC} $1"
}

# Verificar se está rodando como root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script deve ser executado como root"
        exit 1
    fi
}

# Configurações específicas para este VPS
SUPABASE_URL="http://157.180.78.134:8083"
SUPABASE_ANON_KEY="$1"
SUPABASE_SERVICE_KEY="$2"
POSTGRES_PASSWORD="$3"
JWT_SECRET="$4"
DASHBOARD_USERNAME="$5"
DASHBOARD_PASSWORD="$6"
SECRET_KEY_BASE="$7"
VAULT_ENC_KEY="$8"

DOMAIN="157.180.78.134"
INSTALL_DIR="/var/www/japede-cardapio"
GIT_REPO="https://github.com/cactus377/japede-cardapio.git"

# Verificar argumentos
if [[ -z "$SUPABASE_ANON_KEY" || -z "$SUPABASE_SERVICE_KEY" || -z "$POSTGRES_PASSWORD" || -z "$JWT_SECRET" ]]; then
    log_error "Uso: $0 <SUPABASE_ANON_KEY> <SUPABASE_SERVICE_KEY> <POSTGRES_PASSWORD> <JWT_SECRET> <DASHBOARD_USERNAME> <DASHBOARD_PASSWORD> <SECRET_KEY_BASE> <VAULT_ENC_KEY>"
    exit 1
fi

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
    
    # API proxy para Supabase
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
SEED_FILE="$4"

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

# Ler e executar seed data
if [[ -f "$SEED_FILE" ]]; then
    echo "Executando dados iniciais..."
    SQL_CONTENT=$(cat "$SEED_FILE" | tr '\n' ' ' | sed 's/"/\\"/g')
    execute_sql "$SQL_CONTENT"
    echo "Dados iniciais executados"
else
    echo "Arquivo de seed data não encontrado: $SEED_FILE"
fi
EOF
            
            chmod +x temp_setup_db.sh
            ./temp_setup_db.sh "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY" "supabase_schema.sql" "supabase_seed_data.sql"
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

# Configurar PM2
setup_pm2() {
    log_step "Configurando PM2..."
    
    # Instalar PM2 globalmente
    npm install -g pm2
    
    cd "$INSTALL_DIR"
    
    # Iniciar aplicação com PM2
    pm2 start ecosystem.config.js
    
    # Salvar configuração do PM2
    pm2 save
    
    # Configurar PM2 para iniciar no boot
    pm2 startup
    
    log_success "PM2 configurado"
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

# Reiniciar PM2
log_info "Reiniciando aplicação..."
pm2 restart japede-cardapio

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

# Status do PM2
echo
echo "PM2:"
if command -v pm2 &> /dev/null && pm2 list | grep -q "japede-cardapio"; then
    echo "  ✅ Aplicação rodando"
    pm2 list | grep "japede-cardapio"
else
    echo "  ❌ Aplicação não está rodando"
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
echo "Logs recentes da aplicação (últimas 5 linhas):"
pm2 logs japede-cardapio --lines 5 2>/dev/null || echo "  Nenhum log recente"

echo
echo "=== Fim do Status ==="
EOF
    
    # Tornar scripts executáveis
    chmod +x "$INSTALL_DIR/update.sh"
    chmod +x "$INSTALL_DIR/backup.sh"
    chmod +x "$INSTALL_DIR/status.sh"
    
    log_success "Scripts de utilitários criados"
}

# Configurar Supabase no EasyPanel
setup_supabase_easypanel() {
    log_step "Configurando Supabase no EasyPanel..."
    
    log_info "Para configurar o Supabase no EasyPanel, siga estas instruções:"
    log_info "1. Acesse o painel do EasyPanel"
    log_info "2. Crie uma nova aplicação Supabase com as seguintes variáveis:"
    log_info "   - POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
    log_info "   - JWT_SECRET: $JWT_SECRET"
    log_info "   - ANON_KEY: $SUPABASE_ANON_KEY"
    log_info "   - SERVICE_ROLE_KEY: $SUPABASE_SERVICE_KEY"
    log_info "   - DASHBOARD_USERNAME: $DASHBOARD_USERNAME"
    log_info "   - DASHBOARD_PASSWORD: $DASHBOARD_PASSWORD"
    log_info "   - SECRET_KEY_BASE: $SECRET_KEY_BASE"
    log_info "   - VAULT_ENC_KEY: $VAULT_ENC_KEY"
    log_info "3. Configure a porta 8083 para acesso externo"
    log_info "4. Após a instalação, importe o schema e os dados iniciais"
    
    log_warning "Esta etapa deve ser realizada manualmente através da interface do EasyPanel"
}

# Verificar instalação
verify_installation() {
    log_step "Verificando instalação..."
    
    # Verificar se Nginx está rodando
    if ! systemctl is-active --quiet nginx; then
        log_error "Nginx não está rodando"
        return 1
    fi
    
    # Verificar se PM2 está rodando
    if ! pm2 list | grep -q "japede-cardapio"; then
        log_error "Aplicação não está rodando no PM2"
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
    echo "🍕 ==================================="
    echo "   JáPede Cardápio - Instalador VPS"
    echo "   Configuração para 157.180.78.134"
    echo "==================================="
    echo -e "${NC}"
    
    check_root
    
    log_step "=== Iniciando Instalação ==="
    
    update_system
    install_nodejs
    install_nginx
    setup_firewall
    setup_project
    setup_nginx_config
    setup_database
    setup_pm2
    create_utility_scripts
    setup_supabase_easypanel
    verify_installation
    
    echo
    echo -e "${GREEN}🎉 ==================================="
    echo "   Instalação Concluída com Sucesso!"
    echo "===================================${NC}"
    echo
    
    log_info "URLs de acesso:"
    log_info "  🔓 HTTP:  http://$DOMAIN"
    log_info "  🔐 Supabase: http://$DOMAIN:8083"
    
    echo
    log_info "Scripts úteis criados em $INSTALL_DIR:"
    log_info "  📄 Status:     ./status.sh"
    log_info "  🔄 Atualizar:  ./update.sh"
    log_info "  💾 Backup:     ./backup.sh"
    
    echo
    log_info "Comandos úteis:"
    log_info "  Status Nginx:     systemctl status nginx"
    log_info "  Status PM2:       pm2 status"
    log_info "  Logs do site:     tail -f /var/log/nginx/japede-cardapio.error.log"
    log_info "  Logs da aplicação: pm2 logs japede-cardapio"
    log_info "  Recarregar Nginx: systemctl reload nginx"
    log_info "  Reiniciar app:    pm2 restart japede-cardapio"
    
    echo
    log_warning "Próximos passos importantes:"
    log_warning "  1. 🗄️  Verifique se o Supabase está configurado corretamente"
    log_warning "  2. 🔐 Configure permissões RLS no Supabase se necessário"
    log_warning "  3. 🧪 Teste todas as funcionalidades do sistema"
    log_warning "  4. 📊 Execute: $INSTALL_DIR/status.sh para verificar status"
    
    echo
    log_success "🚀 JáPede Cardápio instalado e pronto para uso!"
}

# Executar função principal
main "$@"