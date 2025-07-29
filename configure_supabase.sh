#!/bin/bash

# Script para configurar o Supabase para o JáPede Cardápio
# Este script configura o banco de dados Supabase com o schema e dados iniciais

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

# Testar conexão com o Supabase
test_connection() {
    log_step "Testando conexão com o Supabase..."
    
    # Testar conexão usando curl
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $SUPABASE_SERVICE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
        "$SUPABASE_URL/rest/v1/")
    
    if [ "$response" = "200" ]; then
        log_success "Conexão com o Supabase estabelecida com sucesso"
        return 0
    else
        log_error "Falha ao conectar com o Supabase. Código de resposta: $response"
        log_error "Verifique se a URL e a chave de serviço estão corretas."
        return 1
    fi
}

# Executar SQL via API REST do Supabase
execute_sql_via_api() {
    local sql_file="$1"
    local description="$2"
    
    log_step "Executando $description via API REST..."
    
    # Ler conteúdo do arquivo SQL
    local sql_content=$(cat "$sql_file" | tr '\n' ' ' | sed 's/"/\\"/g')
    
    # Executar SQL via API REST
    local response=$(curl -s -X POST \
        -H "apikey: $SUPABASE_SERVICE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
        -H "Content-Type: application/json" \
        "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -d "{\"sql\":\"$sql_content\"}")
    
    # Verificar resposta
    if [[ "$response" == *"error"* ]]; then
        log_error "Erro ao executar SQL: $response"
        return 1
    else
        log_success "$description executado com sucesso"
        return 0
    fi
}

# Verificar se o banco já está inicializado
check_database_initialized() {
    log_step "Verificando se o banco já está inicializado..."
    
    # Tentar consultar a tabela categories
    local response=$(curl -s \
        -H "apikey: $SUPABASE_SERVICE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
        "$SUPABASE_URL/rest/v1/categories?select=id&limit=1")
    
    # Verificar se a resposta é um array (mesmo que vazio)
    if [[ "$response" == "[]" || "$response" == *"\"id\""* ]]; then
        log_warning "Banco de dados já parece estar inicializado"
        log_warning "A tabela 'categories' já existe"
        return 0
    elif [[ "$response" == *"error"* && "$response" == *"does not exist"* ]]; then
        log_info "Banco de dados não inicializado"
        return 1
    else
        log_error "Erro ao verificar banco de dados: $response"
        return 2
    fi
}

# Função principal
main() {
    echo -e "${PURPLE}"
    echo "🗄️  ==================================="
    echo "   JáPede Cardápio - Configuração Supabase"
    echo "==================================="
    echo -e "${NC}"
    
    # Testar conexão
    if ! test_connection; then
        exit 1
    fi
    
    # Verificar se o banco já está inicializado
    check_database_initialized
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
    if ! execute_sql_via_api "$SCHEMA_FILE" "Schema do banco de dados"; then
        log_error "Falha ao aplicar o schema do banco de dados."
        exit 1
    fi
    
    # Executar seed data se o arquivo existir
    if [ -f "$SEED_FILE" ]; then
        if ! execute_sql_via_api "$SEED_FILE" "Dados iniciais"; then
            log_warning "Falha ao aplicar os dados iniciais, mas o schema foi aplicado com sucesso."
            log_warning "Você pode tentar aplicar os dados iniciais manualmente."
        fi
    fi
    
    # Verificar se o banco foi inicializado corretamente
    if check_database_initialized; then
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
            local count=$(curl -s \
                -H "apikey: $SUPABASE_SERVICE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
                "$SUPABASE_URL/rest/v1/$table?select=id" | grep -o "id" | wc -l)
            
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