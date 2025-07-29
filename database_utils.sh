#!/bin/bash

# 🍕 Utilitários de Banco de Dados - JáPede Cardápio
# Scripts úteis para gerenciar o banco de dados em produção

set -e

# Incluir funções do setup_database.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/setup_database.sh"

# Carregar variáveis de ambiente
load_env() {
    if [[ -f "$SCRIPT_DIR/.env.local" ]]; then
        source "$SCRIPT_DIR/.env.local"
    elif [[ -f "$SCRIPT_DIR/.env" ]]; then
        source "$SCRIPT_DIR/.env"
    else
        log_warning "Arquivo .env não encontrado. Usando variáveis do sistema."
    fi
}

# Mostrar estatísticas do banco
show_stats() {
    load_env
    
    if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" ]] || [[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then
        log_error "Variáveis de ambiente do Supabase não encontradas"
        return 1
    fi
    
    log_info "=== Estatísticas do Banco de Dados ==="
    
    local supabase_url="$NEXT_PUBLIC_SUPABASE_URL"
    local supabase_key="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
    
    # Buscar contadores de cada tabela
    echo ""
    echo "📊 Contadores das Tabelas:"
    echo "------------------------"
    
    local tables=("categories" "menu_items" "pizza_sizes" "pizza_crusts" "tables" "orders" "order_items" "cash_register_sessions" "system_settings")
    
    for table in "${tables[@]}"; do
        local count
        count=$(curl -s -H "apikey: $supabase_key" \
                     -H "Authorization: Bearer $supabase_key" \
                     -H "Range: 0-0" \
                     "$supabase_url/rest/v1/$table?select=*" \
                     2>/dev/null | grep -o 'content-range: [0-9]*-[0-9]*/[0-9]*' | cut -d'/' -f2 || echo "0")
        
        printf "%-20s: %s registros\n" "$table" "$count"
    done
    
    echo ""
    echo "📈 Status dos Pedidos:"
    echo "---------------------"
    
    local statuses=("Pendente" "Em Preparo" "Pronto para Retirada" "Saiu para Entrega" "Entregue" "Cancelado")
    
    for status in "${statuses[@]}"; do
        local count
        count=$(curl -s -H "apikey: $supabase_key" \
                     -H "Authorization: Bearer $supabase_key" \
                     "$supabase_url/rest/v1/orders?status=eq.$status&select=count" \
                     2>/dev/null | jq -r '.[0].count // 0' 2>/dev/null || echo "0")
        
        printf "%-20s: %s pedidos\n" "$status" "$count"
    done
    
    echo ""
}

# Limpar dados de teste
clear_test_data() {
    load_env
    
    log_warning "⚠️  Esta operação irá remover TODOS os pedidos e dados de teste!"
    read -p "Tem certeza? Digite 'CONFIRMAR' para continuar: " confirm
    
    if [[ "$confirm" != "CONFIRMAR" ]]; then
        log_info "Operação cancelada"
        return 0
    fi
    
    local supabase_url="$NEXT_PUBLIC_SUPABASE_URL"
    local service_key="$SUPABASE_SERVICE_ROLE_KEY"
    
    if [[ -z "$service_key" ]]; then
        log_error "Chave de serviço do Supabase necessária para esta operação"
        return 1
    fi
    
    log_info "Limpando dados de teste..."
    
    # Deletar pedidos e itens relacionados
    curl -s -X DELETE \
         -H "apikey: $service_key" \
         -H "Authorization: Bearer $service_key" \
         "$supabase_url/rest/v1/order_items" >/dev/null
    
    curl -s -X DELETE \
         -H "apikey: $service_key" \
         -H "Authorization: Bearer $service_key" \
         "$supabase_url/rest/v1/orders" >/dev/null
    
    # Deletar sessões de caixa
    curl -s -X DELETE \
         -H "apikey: $service_key" \
         -H "Authorization: Bearer $service_key" \
         "$supabase_url/rest/v1/cash_adjustments" >/dev/null
    
    curl -s -X DELETE \
         -H "apikey: $service_key" \
         -H "Authorization: Bearer $service_key" \
         "$supabase_url/rest/v1/cash_register_sessions" >/dev/null
    
    log_success "Dados de teste removidos"
}

# Resetar dados para demonstração
reset_demo_data() {
    log_info "Resetando dados para demonstração..."
    
    # Primeiro limpar dados existentes
    clear_test_data
    
    # Depois recriar dados iniciais
    load_env
    
    local supabase_url="$NEXT_PUBLIC_SUPABASE_URL"
    local service_key="$SUPABASE_SERVICE_ROLE_KEY"
    local db_url="$DATABASE_URL"
    
    if [[ -n "$db_url" ]]; then
        execute_sql_via_psql "$db_url" "$SCRIPT_DIR/supabase_seed_data.sql"
    else
        execute_sql_via_api "$supabase_url" "$service_key" "$SCRIPT_DIR/supabase_seed_data.sql"
    fi
    
    log_success "Dados de demonstração resetados"
}

# Verificar integridade do banco
check_integrity() {
    load_env
    
    log_info "=== Verificação de Integridade ==="
    
    local supabase_url="$NEXT_PUBLIC_SUPABASE_URL"
    local supabase_key="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
    
    # Verificar se todas as tabelas essenciais existem
    local essential_tables=("categories" "menu_items" "tables" "orders")
    local missing_tables=()
    
    for table in "${essential_tables[@]}"; do
        local response
        response=$(curl -s -H "apikey: $supabase_key" \
                        -H "Authorization: Bearer $supabase_key" \
                        "$supabase_url/rest/v1/$table?limit=1" 2>/dev/null)
        
        if [[ "$response" == *"error"* ]] || [[ "$response" == *"does not exist"* ]]; then
            missing_tables+=("$table")
        fi
    done
    
    if [[ ${#missing_tables[@]} -eq 0 ]]; then
        log_success "✅ Todas as tabelas essenciais estão presentes"
    else
        log_error "❌ Tabelas faltando: ${missing_tables[*]}"
        log_info "Execute: ./setup_database.sh init para criar as tabelas"
        return 1
    fi
    
    # Verificar se há categorias
    local cat_count
    cat_count=$(curl -s -H "apikey: $supabase_key" \
                     -H "Authorization: Bearer $supabase_key" \
                     "$supabase_url/rest/v1/categories?select=count" \
                     2>/dev/null | jq length 2>/dev/null || echo "0")
    
    if [[ "$cat_count" -gt 0 ]]; then
        log_success "✅ Categorias encontradas: $cat_count"
    else
        log_warning "⚠️  Nenhuma categoria encontrada. Execute: ./setup_database.sh init"
    fi
    
    # Verificar se há itens do menu
    local menu_count
    menu_count=$(curl -s -H "apikey: $supabase_key" \
                      -H "Authorization: Bearer $supabase_key" \
                      "$supabase_url/rest/v1/menu_items?select=count" \
                      2>/dev/null | jq length 2>/dev/null || echo "0")
    
    if [[ "$menu_count" -gt 0 ]]; then
        log_success "✅ Itens do menu encontrados: $menu_count"
    else
        log_warning "⚠️  Nenhum item do menu encontrado"
    fi
    
    log_success "Verificação de integridade concluída"
}

# Exportar dados de configuração
export_config() {
    load_env
    
    local export_file="${1:-japede_config_$(date +%Y%m%d_%H%M%S).json}"
    
    log_info "Exportando configurações para: $export_file"
    
    local supabase_url="$NEXT_PUBLIC_SUPABASE_URL"
    local supabase_key="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
    
    # Exportar categorias e itens do menu
    {
        echo "{"
        echo "  \"export_date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
        echo "  \"categories\": $(curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/categories"),"
        echo "  \"menu_items\": $(curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/menu_items"),"
        echo "  \"pizza_sizes\": $(curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/pizza_sizes"),"
        echo "  \"pizza_crusts\": $(curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/pizza_crusts"),"
        echo "  \"tables\": $(curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/tables"),"
        echo "  \"system_settings\": $(curl -s -H "apikey: $supabase_key" -H "Authorization: Bearer $supabase_key" "$supabase_url/rest/v1/system_settings")"
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
        # Modo de linha de comando
        case "$1" in
            "stats") show_stats ;;
            "check") check_integrity ;;
            "clear") clear_test_data ;;
            "reset") reset_demo_data ;;
            "export") export_config "$2" ;;
            "reinit") 
                load_env
                ./setup_database.sh force-init "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$DATABASE_URL"
                ;;
            "backup")
                load_env
                ./setup_database.sh backup "$DATABASE_URL"
                ;;
            *) 
                echo "Uso: $0 {stats|check|clear|reset|export|reinit|backup}"
                exit 1
                ;;
        esac
    else
        # Modo interativo
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
                    load_env
                    ./setup_database.sh force-init "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$DATABASE_URL"
                    ;;
                7)
                    load_env
                    ./setup_database.sh backup "$DATABASE_URL"
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

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
