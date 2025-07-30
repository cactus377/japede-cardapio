#!/bin/bash

# 🍕 Script de Configuração do Banco de Dados - JáPede Cardápio
# Este script inicializa e popula o banco de dados Supabase

set -e

# Incluir funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common_functions.sh"

# Inicializar banco de dados
init_database() {
    local supabase_url="$1"
    local supabase_anon_key="$2"
    local supabase_service_key="$3"
    local db_url="$4"
    
    log_info "=== Inicializando Banco de Dados ==="
    
    if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
        log_error "Variáveis de ambiente obrigatórias não definidas"
        return 1
    fi
    
    if ! test_supabase_connection "$supabase_url" "$supabase_anon_key"; then
        return 1
    fi
    
    local schema_file="$SCRIPT_DIR/supabase_schema.sql"
    local seed_file="$SCRIPT_DIR/supabase_seed_data.sql"
    
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
        execute_sql_via_psql "$db_url" "$schema_file" "schema do banco"
    else
        local sql_content=$(cat "$schema_file")
        execute_sql_via_api "$supabase_url" "$supabase_service_key" "$sql_content" "schema do banco"
    fi
    
    if [[ $? -ne 0 ]]; then
        log_error "Falha ao criar tabelas"
        return 1
    fi
    
    # Executar dados iniciais
    log_info "Populando dados iniciais..."
    if [[ -n "$db_url" ]]; then
        execute_sql_via_psql "$db_url" "$seed_file" "dados iniciais"
    else
        local sql_content=$(cat "$seed_file")
        execute_sql_via_api "$supabase_url" "$supabase_service_key" "$sql_content" "dados iniciais"
    fi
    
    if [[ $? -ne 0 ]]; then
        log_warning "Falha ao inserir dados iniciais (pode ser normal se já existirem)"
    fi
    
    log_success "Banco de dados inicializado com sucesso!"
}

# Criar backup do banco
backup_database() {
    local db_url="$1"
    local backup_dir="${2:-/var/backups/japede-cardapio}"
    
    log_info "Criando backup do banco de dados..."
    
    if ! check_dependencies pg_dump; then
        log_info "Instalando PostgreSQL client..."
        install_dependencies postgresql-client
    fi
    
    mkdir -p "$backup_dir"
    
    local backup_file="$backup_dir/database_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$db_url" > "$backup_file"; then
        log_success "Backup criado: $backup_file"
        
        # Manter apenas os 5 backups mais recentes
        ls -t "$backup_dir"/database_backup_*.sql | tail -n +6 | xargs -r rm
        
        return 0
    else
        log_error "Falha ao criar backup"
        return 1
    fi
}

# Função principal
main() {
    local command="${1:-init}"
    
    # Carregar variáveis de ambiente
    load_env "$SCRIPT_DIR"
    
    case "$command" in
        "init")
            if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
                log_error "Configure as variáveis de ambiente no arquivo .env.local"
                exit 1
            fi
            
            log_info "🍕 Iniciando configuração do banco de dados JáPede Cardápio"
            
            if check_database_initialized "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
                log_warning "Banco já inicializado. Use 'force-init' para reinicializar."
                exit 0
            fi
            
            init_database "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$DATABASE_URL"
            ;;
            
        "force-init")
            if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
                log_error "Configure as variáveis de ambiente no arquivo .env.local"
                exit 1
            fi
            
            log_warning "Forçando reinicialização do banco de dados..."
            init_database "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$DATABASE_URL"
            ;;
            
        "check")
            if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
                log_error "Configure as variáveis de ambiente no arquivo .env.local"
                exit 1
            fi
            
            test_supabase_connection "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
            check_database_initialized "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
            ;;
            
        "backup")
            if ! validate_env_vars "DATABASE_URL"; then
                log_error "Variável DATABASE_URL não definida"
                exit 1
            fi
            
            backup_database "$DATABASE_URL" "$2"
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
            echo "Configure as variáveis no arquivo .env.local antes de usar"
            exit 1
            ;;
    esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi



