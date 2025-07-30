#!/bin/bash

# 🍕 Funções Comuns - JáPede Cardápio
# Biblioteca de funções compartilhadas entre scripts

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Funções de log padronizadas
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

# Carregar variáveis de ambiente de forma padronizada
load_env() {
    local script_dir="$1"
    
    if [[ -f "$script_dir/.env.local" ]]; then
        source "$script_dir/.env.local"
        log_info "Carregado: .env.local"
    elif [[ -f "$script_dir/.env" ]]; then
        source "$script_dir/.env"
        log_info "Carregado: .env"
    else
        log_warning "Arquivo .env não encontrado. Usando variáveis do sistema."
    fi
}

# Verificar dependências necessárias
check_dependencies() {
    local deps=("$@")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Dependências faltando: ${missing[*]}"
        return 1
    fi
    
    return 0
}

# Instalar dependências automaticamente
install_dependencies() {
    local deps=("$@")
    
    log_info "Instalando dependências: ${deps[*]}"
    
    # Detectar sistema operacional
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y "${deps[@]}"
    elif command -v yum &> /dev/null; then
        yum install -y "${deps[@]}"
    elif command -v brew &> /dev/null; then
        brew install "${deps[@]}"
    else
        log_error "Gerenciador de pacotes não suportado"
        return 1
    fi
}

# Verificar conexão com Supabase
test_supabase_connection() {
    local supabase_url="$1"
    local supabase_key="$2"
    
    log_info "Testando conexão com Supabase..."
    
    if ! check_dependencies curl; then
        log_error "curl não está instalado"
        return 1
    fi
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $supabase_key" \
        -H "Authorization: Bearer $supabase_key" \
        "$supabase_url/rest/v1/" 2>/dev/null)
    
    if [[ "$response" == "200" ]]; then
        log_success "Conexão com Supabase estabelecida"
        return 0
    else
        log_error "Falha ao conectar com Supabase (HTTP: $response)"
        log_warning "Verifique URL: $supabase_url"
        log_warning "Verifique chave: ${supabase_key:0:20}..."
        return 1
    fi
}

# Verificar se banco está inicializado
check_database_initialized() {
    local supabase_url="$1"
    local supabase_key="$2"
    
    log_info "Verificando se banco está inicializado..."
    
    local response
    response=$(curl -s \
        -H "apikey: $supabase_key" \
        -H "Authorization: Bearer $supabase_key" \
        "$supabase_url/rest/v1/categories?select=id&limit=1" 2>/dev/null)
    
    if [[ "$response" == "[]" ]] || [[ "$response" == *"\"id\""* ]]; then
        log_info "Banco de dados já está inicializado"
        return 0
    elif [[ "$response" == *"error"* ]] && [[ "$response" == *"does not exist"* ]]; then
        log_info "Banco de dados não está inicializado"
        return 1
    else
        log_error "Erro ao verificar banco: $response"
        return 2
    fi
}

# Executar SQL via API REST
execute_sql_via_api() {
    local supabase_url="$1"
    local service_key="$2"
    local sql_content="$3"
    local description="$4"
    
    log_info "Executando $description via API REST..."
    
    local response
    response=$(curl -s -X POST \
        -H "apikey: $service_key" \
        -H "Authorization: Bearer $service_key" \
        -H "Content-Type: application/json" \
        "$supabase_url/rest/v1/rpc/exec_sql" \
        -d "{\"sql\":$(echo "$sql_content" | jq -Rs .)}" 2>&1)
    
    if [[ "$response" == *"error"* ]]; then
        log_error "Erro ao executar SQL: $response"
        return 1
    else
        log_success "$description executado com sucesso"
        return 0
    fi
}

# Executar SQL via psql
execute_sql_via_psql() {
    local db_url="$1"
    local sql_file="$2"
    local description="$3"
    
    log_info "Executando $description via psql..."
    
    if ! check_dependencies psql; then
        log_info "Instalando PostgreSQL client..."
        install_dependencies postgresql-client
    fi
    
    if psql "$db_url" -f "$sql_file" -v ON_ERROR_STOP=1 &>/dev/null; then
        log_success "$description executado com sucesso"
        return 0
    else
        log_error "Falha ao executar $description"
        return 1
    fi
}

# Validar variáveis de ambiente obrigatórias
validate_env_vars() {
    local required_vars=("$@")
    local missing=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing+=("$var")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Variáveis de ambiente obrigatórias não definidas:"
        for var in "${missing[@]}"; do
            log_error "  - $var"
        done
        return 1
    fi
    
    return 0
}

# Obter estatísticas de tabela
get_table_count() {
    local supabase_url="$1"
    local supabase_key="$2"
    local table="$3"
    
    local count
    count=$(curl -s -H "apikey: $supabase_key" \
                 -H "Authorization: Bearer $supabase_key" \
                 -H "Range: 0-0" \
                 "$supabase_url/rest/v1/$table?select=*" \
                 2>/dev/null | grep -o 'content-range: [0-9]*-[0-9]*/[0-9]*' | cut -d'/' -f2 2>/dev/null || echo "0")
    
    echo "$count"
}