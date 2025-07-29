#!/bin/bash

# Script para corrigir o arquivo package.json do JáPede Cardápio
# Este script corrige o problema de escape de backslashes no arquivo package.json

set -e

# Cores para output
RED="\033[0;31m"
GREEN="\033[0;32m"
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

# Verificar se o arquivo package.json existe
if [ ! -f "package.json" ]; then
  log_error "Arquivo package.json não encontrado no diretório atual"
  exit 1
fi

# Fazer backup do arquivo original
log "Criando backup do arquivo package.json"
cp package.json package.json.bak

# Corrigir o problema de escape de backslashes
log "Corrigindo o arquivo package.json"
sed -i 's/\.\\install_windows\.ps1/\.\\\\install_windows\.ps1/g' package.json

# Verificar se a correção foi aplicada
if grep -q "\.\\\\install_windows\.ps1" package.json; then
  log_success "Arquivo package.json corrigido com sucesso"
else
  log_error "Falha ao corrigir o arquivo package.json"
  log "Restaurando backup..."
  cp package.json.bak package.json
  exit 1
fi

log_success "Processo concluído. Agora você pode executar os comandos npm sem erros de parsing JSON."