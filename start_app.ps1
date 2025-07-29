# Script para iniciar o JáPede Cardápio no Windows

# Obter o diretório atual do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Função para exibir mensagens
function Write-ColorLog {
    param (
        [string]$Message,
        [string]$Color = "Cyan"
    )

    Write-Host $Message -ForegroundColor $Color
}

# Verificar se o arquivo .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-ColorLog "Arquivo .env.local não encontrado. Criando a partir do exemplo..." "Yellow"
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-ColorLog "Arquivo .env.local criado. Por favor, edite-o com suas configurações reais." "Yellow"
    } else {
        Write-ColorLog "Arquivo .env.example não encontrado. Criando .env.local com configurações padrão..." "Yellow"
        @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://157.180.134.78:8083
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Environment
NODE_ENV=development
VITE_NODE_ENV=development

# App Configuration
VITE_APP_TITLE=JáPede Cardápio
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    }
}

# Verificar se o node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-ColorLog "Instalando dependências..." "Yellow"
    npm install
}

# Iniciar a aplicação
Write-ColorLog "Iniciando JáPede Cardápio..." "Green"
Write-ColorLog "Frontend: http://localhost:5173" "Green"
Write-ColorLog "Backend: http://localhost:3001" "Green"
Write-ColorLog "Pressione Ctrl+C para encerrar a aplicação" "Yellow"

# Iniciar o frontend e o backend
npm run dev:full

# Abrir o navegador (opcional, comentado por padrão)
# Start-Process "http://localhost:5173"