#!/bin/bash

# Script para configurar o Supabase para o JáPede Cardápio
# Este script configura o banco de dados Supabase com o schema e dados iniciais

set -e

# Incluir funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common_functions.sh"

# Verificar argumentos
if [ "$#" -lt 2 ]; then
    log_error "Uso: $0 <SUPABASE_URL> <SUPABASE_SERVICE_KEY> [SCHEMA_FILE] [SEED_FILE]"
    log_info "Exemplo: $0 http://localhost:8083 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ./supabase_schema.sql ./supabase_seed_data.sql"
    exit 1
fi

SUPABASE_URL="$1"
SUPABASE_SERVICE_KEY="$2"
SCHEMA_FILE="${3:-./supabase_schema.sql}"
SEED_FILE="${4:-./supabase_seed_data.sql}"

# Verificar se os arquivos existem
if [ ! -f "$SCHEMA_FILE" ]; then
    log_error "Arquivo de schema não encontrado: $SCHEMA_FILE"
    exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
    log_warning "Arquivo de dados iniciais não encontrado: $SEED_FILE"
    log_warning "Apenas o schema será aplicado."
fi

# Função principal
main() {
    echo -e "${PURPLE}"
    echo "🗄️  ==================================="
    echo "   JáPede Cardápio - Configuração Supabase"
    echo "==================================="
    echo -e "${NC}"
    
    # Verificar dependências
    if ! check_dependencies curl jq; then
        log_info "Instalando dependências necessárias..."
        install_dependencies curl jq
    fi
    
    # Testar conexão
    if ! test_supabase_connection "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY"; then
        exit 1
    fi
    
    # Verificar se o banco já está inicializado
    check_database_initialized "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY"
    local db_status=$?
    
    if [ "$db_status" -eq 0 ]; then
        log_warning "O banco de dados já parece estar inicializado."
        read -p "Deseja continuar e reinicializar o banco? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Operação cancelada pelo usuário."
            exit 0
        fi
        log_warning "Continuando com a reinicialização do banco..."
    elif [ "$db_status" -eq 2 ]; then
        log_error "Não foi possível verificar o estado do banco. Abortando."
        exit 1
    fi
    
    # Executar schema
    local sql_content=$(cat "$SCHEMA_FILE")
    if ! execute_sql_via_api "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY" "$sql_content" "Schema do banco de dados"; then
        log_error "Falha ao aplicar o schema do banco de dados."
        exit 1
    fi
    
    # Executar seed data se o arquivo existir
    if [ -f "$SEED_FILE" ]; then
        local seed_content=$(cat "$SEED_FILE")
        if ! execute_sql_via_api "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY" "$seed_content" "Dados iniciais"; then
            log_warning "Falha ao aplicar os dados iniciais, mas o schema foi aplicado com sucesso."
            log_warning "Você pode tentar aplicar os dados iniciais manualmente."
        fi
    fi
    
    # Verificar se o banco foi inicializado corretamente
    if check_database_initialized "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY"; then
        echo
        echo -e "${GREEN}🎉 ==================================="
        echo "   Banco de Dados Configurado com Sucesso!"
        echo "===================================${NC}"
        echo
        
        log_info "O banco de dados Supabase foi configurado com sucesso."
        log_info "URL do Supabase: $SUPABASE_URL"
        
        # Contar registros nas tabelas principais
        log_step "Verificando registros nas tabelas principais..."
        
        local tables=("categories" "menu_items" "tables" "system_settings")
        
        for table in "${tables[@]}"; do
            local count
            count=$(get_table_count "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY" "$table")
            log_info "Tabela $table: $count registros"
        done
        
        echo
        log_success "🚀 Banco de dados pronto para uso!"
    else
        log_error "Não foi possível verificar se o banco foi inicializado corretamente."
        log_error "Verifique manualmente se as tabelas foram criadas."
        exit 1
    fi
}

# Executar função principal
main
