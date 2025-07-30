#!/bin/bash

# 🍕 Utilitários de Banco de Dados - JáPede Cardápio
# Scripts úteis para gerenciar o banco de dados em produção

set -e

# Incluir funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common_functions.sh"

# Mostrar estatísticas do banco
show_stats() {
    load_env "$SCRIPT_DIR"
    
    if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
        return 1
    fi
    
    if ! test_supabase_connection "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
        return 1
    fi
    
    log_info "=== Estatísticas do Banco de Dados ==="
    
    echo ""
    echo "📊 Contadores das Tabelas:"
    echo "------------------------"
    
    local tables=("categories" "menu_items" "pizza_sizes" "pizza_crusts" "tables" "orders" "order_items" "cash_register_sessions" "system_settings")
    
    for table in "${tables[@]}"; do
        local count
        count=$(get_table_count "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$table")
        printf "%-20s: %s registros\n" "$table" "$count"
    done
}

# Limpar dados de teste
clear_test_data() {
    load_env "$SCRIPT_DIR"
    
    if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY"; then
        return 1
    fi
    
    log_warning "⚠️  Esta operação irá remover TODOS os pedidos e dados de teste!"
    read -p "Tem certeza? Digite 'CONFIRMAR' para continuar: " confirm
    
    if [[ "$confirm" != "CONFIRMAR" ]]; then
        log_info "Operação cancelada"
        return 0
    fi
    
    log_info "Limpando dados de teste..."
    
    # Deletar pedidos e itens relacionados
    curl -s -X DELETE \
         -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
         -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
         "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/order_items" >/dev/null
    
    curl -s -X DELETE \
         -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
         -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
         "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/orders" >/dev/null
    
    log_success "Dados de teste removidos"
}

# Resetar dados para demonstração
reset_demo_data() {
    log_info "Resetando dados para demonstração..."
    
    clear_test_data
    
    load_env "$SCRIPT_DIR"
    
    if [[ -n "$DATABASE_URL" ]]; then
        execute_sql_via_psql "$DATABASE_URL" "$SCRIPT_DIR/supabase_seed_data.sql" "dados de demonstração"
    else
        local sql_content=$(cat "$SCRIPT_DIR/supabase_seed_data.sql")
        execute_sql_via_api "$NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_SERVICE_ROLE_KEY" "$sql_content" "dados de demonstração"
    fi
    
    log_success "Dados de demonstração resetados"
}

# Verificar integridade do banco
check_integrity() {
    load_env "$SCRIPT_DIR"
    
    if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
        return 1
    fi
    
    log_info "=== Verificação de Integridade ==="
    
    # Usar função comum para verificar inicialização
    if check_database_initialized "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
        log_success "✅ Banco de dados está inicializado"
    else
        log_error "❌ Banco de dados não está inicializado"
        log_info "Execute: ./setup_database.sh init para criar as tabelas"
        return 1
    fi
    
    # Verificar contadores das tabelas principais
    local essential_tables=("categories" "menu_items" "tables")
    
    for table in "${essential_tables[@]}"; do
        local count
        count=$(get_table_count "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$table")
        
        if [[ "$count" -gt 0 ]]; then
            log_success "✅ $table: $count registros"
        else
            log_warning "⚠️  $table: nenhum registro encontrado"
        fi
    done
    
    log_success "Verificação de integridade concluída"
}

# Exportar dados de configuração
export_config() {
    load_env "$SCRIPT_DIR"
    
    if ! validate_env_vars "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
        return 1
    fi
    
    local export_file="${1:-japede_config_$(date +%Y%m%d_%H%M%S).json}"
    
    log_info "Exportando configurações para: $export_file"
    
    {
        echo "{"
        echo "  \"categories\": $(curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/categories"),"
        echo "  \"menu_items\": $(curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/menu_items"),"
        echo "  \"tables\": $(curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/tables"),"
        echo "  \"system_settings\": $(curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/system_settings")"
        echo "}"
    } > "$export_file"
    
    log_success "Configurações exportadas para: $export_file"
}

# Menu principal
show_menu() {
    echo ""
    echo "🍕 === Utilitários de Banco de Dados JáPede === 🍕"
    echo ""
    echo "1. Mostrar estatísticas do banco"
    echo "2. Verificar integridade do banco"
    echo "3. Limpar dados de teste"
    echo "4. Resetar dados de demonstração"
    echo "5. Exportar configurações"
    echo "6. Reinicializar banco completo"
    echo "7. Fazer backup do banco"
    echo "8. Sair"
    echo ""
}

# Função principal
main() {
    if [[ $# -gt 0 ]]; then
        case "$1" in
            "stats") show_stats ;;
            "check") check_integrity ;;
            "clear") clear_test_data ;;
            "reset") reset_demo_data ;;
            "export") export_config "$2" ;;
            "reinit") 
                load_env "$SCRIPT_DIR"
                "$SCRIPT_DIR/setup_database.sh" force-init
                ;;
            "backup")
                load_env "$SCRIPT_DIR"
                "$SCRIPT_DIR/setup_database.sh" backup
                ;;
            *) 
                echo "Uso: $0 {stats|check|clear|reset|export|reinit|backup}"
                exit 1
                ;;
        esac
    else
        while true; do
            show_menu
            read -p "Escolha uma opção (1-8): " choice
            
            case $choice in
                1) show_stats ;;
                2) check_integrity ;;
                3) clear_test_data ;;
                4) reset_demo_data ;;
                5) 
                    read -p "Nome do arquivo (enter para padrão): " filename
                    export_config "$filename"
                    ;;
                6) 
                    "$SCRIPT_DIR/setup_database.sh" force-init
                    ;;
                7)
                    "$SCRIPT_DIR/setup_database.sh" backup
                    ;;
                8) 
                    log_info "Saindo..."
                    exit 0
                    ;;
                *) 
                    log_warning "Opção inválida. Tente novamente."
                    ;;
            esac
            
            echo ""
            read -p "Pressione Enter para continuar..."
        done
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi


