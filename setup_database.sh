#!/bin/bash

# 🍕 Script de Configuração do Banco de Dados - JáPede Cardápio
# Este script inicializa e popula o banco de dados Supabase

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[DATABASE]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[DATABASE]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[DATABASE]${NC} $1"
}

log_error() {
    echo -e "${RED}[DATABASE]${NC} $1"
}

# Verificar se o Supabase CLI está instalado
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        log_info "Instalando Supabase CLI..."
        
        # Instalar Supabase CLI
        curl -fsSL https://github.com/supabase/cli/releases/download/v1.127.4/supabase_linux_amd64.tar.gz | tar -xzC /usr/local/bin
        chmod +x /usr/local/bin/supabase
        
        if command -v supabase &> /dev/null; then
            log_success "Supabase CLI instalado com sucesso"
        else
            log_error "Falha ao instalar Supabase CLI"
            return 1
        fi
    else
        log_info "Supabase CLI já está instalado: $(supabase --version)"
    fi
}

# Verificar conexão com o Supabase
test_supabase_connection() {
    local supabase_url="$1"
    local supabase_key="$2"
    
    log_info "Testando conexão com Supabase..."
    
    # Testar conexão usando curl
    if curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/" > /dev/null; then
        log_success "Conexão com Supabase estabelecida com sucesso"
        return 0
    else
        log_error "Falha ao conectar com Supabase"
        log_warning "Verifique se a URL e chave estão corretas:"
        log_warning "  URL: $supabase_url"
        log_warning "  Chave: ${supabase_key:0:20}..."
        return 1
    fi
}

# Executar SQL no Supabase via REST API
execute_sql_via_api() {
    local supabase_url="$1"
    local service_role_key="$2"
    local sql_file="$3"
    
    log_info "Executando SQL: $(basename "$sql_file")"
    
    if [[ ! -f "$sql_file" ]]; then
        log_error "Arquivo SQL não encontrado: $sql_file"
        return 1
    fi
    
    # Ler o conteúdo do arquivo SQL
    local sql_content
    sql_content=$(cat "$sql_file")
    
    # Executar via API RPC
    local response
    response=$(curl -s -X POST \
        -H "apikey: $service_role_key" \
        -H "Authorization: Bearer $service_role_key" \
        -H "Content-Type: application/json" \
        "$supabase_url/rest/v1/rpc/exec_sql" \
        -d "{\"sql\":$(echo "$sql_content" | jq -Rs .)}" 2>&1)
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "SQL executado com sucesso: $(basename "$sql_file")"
        return 0
    else
        log_warning "API RPC não disponível, tentando método alternativo..."
        return 1
    fi
}

# Executar SQL usando psql (se disponível)
execute_sql_via_psql() {
    local db_url="$1"
    local sql_file="$2"
    
    log_info "Executando SQL via psql: $(basename "$sql_file")"
    
    if ! command -v psql &> /dev/null; then
        log_info "Instalando PostgreSQL client..."
        apt-get update
        apt-get install -y postgresql-client
    fi
    
    if psql "$db_url" -f "$sql_file" -v ON_ERROR_STOP=1; then
        log_success "SQL executado com sucesso: $(basename "$sql_file")"
        return 0
    else
        log_error "Falha ao executar SQL: $(basename "$sql_file")"
        return 1
    fi
}

# Inicializar banco de dados
init_database() {
    local supabase_url="$1"
    local supabase_anon_key="$2"
    local supabase_service_key="$3"
    local db_url="$4"
    
    log_info "=== Inicializando Banco de Dados ==="
    
    # Testar conexão primeiro
    if ! test_supabase_connection "$supabase_url" "$supabase_anon_key"; then
        return 1
    fi
    
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    local schema_file="$script_dir/supabase_schema.sql"
    local seed_file="$script_dir/supabase_seed_data.sql"
    
    # Verificar se os arquivos existem
    if [[ ! -f "$schema_file" ]]; then
        log_error "Arquivo de schema não encontrado: $schema_file"
        return 1
    fi
    
    if [[ ! -f "$seed_file" ]]; then
        log_error "Arquivo de dados iniciais não encontrado: $seed_file"
        return 1
    fi
    
    # Executar schema
    log_info "Criando tabelas do banco de dados..."
    if [[ -n "$db_url" ]]; then
        execute_sql_via_psql "$db_url" "$schema_file"
    else
        execute_sql_via_api "$supabase_url" "$supabase_service_key" "$schema_file"
    fi
    
    if [[ $? -ne 0 ]]; then
        log_error "Falha ao criar tabelas"
        return 1
    fi
    
    # Executar dados iniciais
    log_info "Populando dados iniciais..."
    if [[ -n "$db_url" ]]; then
        execute_sql_via_psql "$db_url" "$seed_file"
    else
        execute_sql_via_api "$supabase_url" "$supabase_service_key" "$seed_file"
    fi
    
    if [[ $? -ne 0 ]]; then
        log_warning "Falha ao inserir dados iniciais (pode ser normal se já existirem)"
    fi
    
    log_success "Banco de dados inicializado com sucesso!"
}

# Verificar se o banco já está inicializado
check_database_initialized() {
    local supabase_url="$1"
    local supabase_key="$2"
    
    log_info "Verificando se o banco já está inicializado..."
    
    # Tentar buscar categorias para verificar se as tabelas existem
    local response
    response=$(curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/categories?select=count" 2>/dev/null)
    
    if [[ $? -eq 0 ]] && [[ "$response" != *"error"* ]] && [[ "$response" != *"relation"*"does not exist"* ]]; then
        log_info "Banco de dados já está inicializado"
        return 0
    else
        log_info "Banco de dados não está inicializado"
        return 1
    fi
}

# Criar backup do banco
backup_database() {
    local db_url="$1"
    local backup_dir="${2:-/var/backups/japede-cardapio}"
    
    log_info "Criando backup do banco de dados..."
    
    mkdir -p "$backup_dir"
    
    local backup_file="$backup_dir/database_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if command -v pg_dump &> /dev/null; then
        if pg_dump "$db_url" > "$backup_file"; then
            log_success "Backup criado: $backup_file"
            
            # Manter apenas os 5 backups mais recentes
            ls -t "$backup_dir"/database_backup_*.sql | tail -n +6 | xargs -r rm
            
            return 0
        else
            log_error "Falha ao criar backup"
            return 1
        fi
    else
        log_warning "pg_dump não disponível, pulando backup"
        return 1
    fi
}

# Função principal
main() {
    local command="${1:-init}"
    local supabase_url="$2"
    local supabase_anon_key="$3"
    local supabase_service_key="$4"
    local db_url="$5"
    
    case "$command" in
        "init")
            if [[ -z "$supabase_url" ]] || [[ -z "$supabase_anon_key" ]]; then
                log_error "Uso: $0 init <SUPABASE_URL> <SUPABASE_ANON_KEY> [SUPABASE_SERVICE_KEY] [DB_URL]"
                exit 1
            fi
            
            log_info "🍕 Iniciando configuração do banco de dados JáPede Cardápio"
            
            # Verificar se já está inicializado
            if check_database_initialized "$supabase_url" "$supabase_anon_key"; then
                log_warning "Banco já inicializado. Use 'force-init' para reinicializar."
                exit 0
            fi
            
            init_database "$supabase_url" "$supabase_anon_key" "$supabase_service_key" "$db_url"
            ;;
            
        "force-init")
            if [[ -z "$supabase_url" ]] || [[ -z "$supabase_anon_key" ]]; then
                log_error "Uso: $0 force-init <SUPABASE_URL> <SUPABASE_ANON_KEY> [SUPABASE_SERVICE_KEY] [DB_URL]"
                exit 1
            fi
            
            log_warning "Forçando reinicialização do banco de dados..."
            init_database "$supabase_url" "$supabase_anon_key" "$supabase_service_key" "$db_url"
            ;;
            
        "check")
            if [[ -z "$supabase_url" ]] || [[ -z "$supabase_anon_key" ]]; then
                log_error "Uso: $0 check <SUPABASE_URL> <SUPABASE_ANON_KEY>"
                exit 1
            fi
            
            test_supabase_connection "$supabase_url" "$supabase_anon_key"
            check_database_initialized "$supabase_url" "$supabase_anon_key"
            ;;
            
        "backup")
            if [[ -z "$db_url" ]]; then
                log_error "Uso: $0 backup <DB_URL> [BACKUP_DIR]"
                exit 1
            fi
            
            backup_database "$db_url" "$supabase_url"
            ;;
            
        *)
            echo "Uso: $0 {init|force-init|check|backup} [argumentos...]"
            echo ""
            echo "Comandos:"
            echo "  init       - Inicializar banco se não existir"
            echo "  force-init - Forçar reinicialização do banco"
            echo "  check      - Verificar conexão e status do banco"
            echo "  backup     - Fazer backup do banco de dados"
            echo ""
            echo "Exemplos:"
            echo "  $0 init https://abc.supabase.co eyJ0... service_key"
            echo "  $0 check https://abc.supabase.co eyJ0..."
            echo "  $0 backup postgresql://user:pass@host:5432/db"
            exit 1
            ;;
    esac
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
