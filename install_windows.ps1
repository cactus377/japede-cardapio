# Script de instalação do JáPede Cardápio para Windows
# Este script configura o ambiente, instala dependências e configura o sistema

# Função para exibir mensagens
function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )

    $Color = "White"
    switch ($Type) {
        "SUCCESS" { $Color = "Green" }
        "ERROR" { $Color = "Red" }
        "WARNING" { $Color = "Yellow" }
        "INFO" { $Color = "Cyan" }
    }

    Write-Host "[$Type] $Message" -ForegroundColor $Color
}

# Verificar se o script está sendo executado como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Log "Este script deve ser executado como administrador" -Type "ERROR"
    exit 1
}

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node -v
    Write-Log "Node.js já está instalado: $nodeVersion"
    
    # Verificar versão do Node.js
    $nodeMajorVersion = $nodeVersion.Substring(1, 2)
    if ([int]$nodeMajorVersion -lt 18) {
        Write-Log "A versão do Node.js é menor que 18. Recomendamos atualizar para a versão 18 ou superior." -Type "WARNING"
    }
} catch {
    Write-Log "Node.js não encontrado. Por favor, instale o Node.js 18 ou superior manualmente." -Type "ERROR"
    Write-Log "Você pode baixá-lo em: https://nodejs.org/" -Type "INFO"
    exit 1
}

# Verificar se o npm está instalado
try {
    $npmVersion = npm -v
    Write-Log "npm já está instalado: $npmVersion"
} catch {
    Write-Log "npm não encontrado. Verifique a instalação do Node.js" -Type "ERROR"
    exit 1
}

# Verificar se o PM2 está instalado
try {
    $pm2Version = pm2 -v
    Write-Log "PM2 já está instalado: $pm2Version"
} catch {
    Write-Log "PM2 não encontrado. Instalando..."
    npm install -g pm2
    Write-Log "PM2 instalado com sucesso" -Type "SUCCESS"
}

# Diretório atual
$currentDir = Get-Location

# Instalar dependências
Write-Log "Instalando dependências da aplicação"
npm install

# Configurar variáveis de ambiente
if (-not (Test-Path ".env.local")) {
    Write-Log "Criando arquivo .env.local"
    @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://157.180.134.78:8083
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Production Environment
NODE_ENV=development
VITE_NODE_ENV=development

# App Configuration
VITE_APP_TITLE=JáPede Cardápio

# Google Gemini API (opcional)
# GEMINI_API_KEY=sua_chave_api_do_gemini
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Log "Arquivo .env.local criado" -Type "SUCCESS"
} else {
    Write-Log "Arquivo .env.local já existe"
}

# Inicializar o banco de dados
Write-Log "Inicializando o banco de dados"
node init_database.js

# Construir a aplicação
Write-Log "Construindo a aplicação"
npm run build

# Criar atalho para iniciar a aplicação
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\JáPede Cardápio.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$currentDir\start_app.ps1`""
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,22"
$Shortcut.Save()

# Criar script de inicialização
@"
cd `"$currentDir`"
Write-Host "Iniciando JáPede Cardápio..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c npm run dev:full" -NoNewWindow
Start-Process "http://localhost:5173"
"@ | Out-File -FilePath "start_app.ps1" -Encoding utf8

Write-Log "Instalação concluída com sucesso!" -Type "SUCCESS"
Write-Log "Para iniciar a aplicação, clique no atalho 'JáPede Cardápio' criado na área de trabalho." -Type "INFO"
Write-Log "Ou execute 'npm run dev:full' no diretório do projeto." -Type "INFO"
Write-Log "A aplicação estará disponível em: http://localhost:5173" -Type "INFO"