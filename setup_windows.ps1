# Script de instalação e configuração do JáPede Cardápio para Windows
# Este script configura o ambiente, instala dependências e inicializa o banco de dados

# Verificar se está sendo executado como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Este script deve ser executado como administrador. Por favor, reinicie como administrador." -ForegroundColor Red
    exit 1
}

# Funções de log
function Write-InfoLog {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-SuccessLog {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-WarningLog {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-StepLog {
    param([string]$Message)
    Write-Host ""
    Write-Host "[STEP] $Message" -ForegroundColor Magenta
}

# Verificar e instalar Node.js
function Install-NodeJS {
    Write-StepLog "Verificando Node.js..."
    
    try {
        $nodeVersion = node -v
        $npmVersion = npm -v
        Write-InfoLog "Node.js já instalado: $nodeVersion"
        Write-InfoLog "NPM já instalado: $npmVersion"
    } catch {
        Write-WarningLog "Node.js não encontrado. Iniciando instalação..."
        
        # Baixar e instalar Node.js LTS
        $nodejsUrl = "https://nodejs.org/dist/v18.16.1/node-v18.16.1-x64.msi"
        $nodejsInstaller = "$env:TEMP\node-installer.msi"
        
        Write-InfoLog "Baixando Node.js..."
        Invoke-WebRequest -Uri $nodejsUrl -OutFile $nodejsInstaller
        
        Write-InfoLog "Instalando Node.js..."
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodejsInstaller`" /quiet /norestart" -Wait
        
        # Verificar instalação
        try {
            $nodeVersion = node -v
            $npmVersion = npm -v
            Write-SuccessLog "Node.js instalado: $nodeVersion"
            Write-SuccessLog "NPM instalado: $npmVersion"
        } catch {
            Write-ErrorLog "Falha ao instalar Node.js. Por favor, instale manualmente de https://nodejs.org/"
            exit 1
        }
    }
    
    # Verificar versão mínima (Node.js 16+)
    $nodeVersionNum = $nodeVersion -replace 'v', '' -split '\.' | ForEach-Object { [int]$_ }
    if ($nodeVersionNum[0] -lt 16) {
        Write-ErrorLog "Versão do Node.js muito antiga. Necessário versão 16 ou superior."
        Write-ErrorLog "Por favor, atualize o Node.js manualmente de https://nodejs.org/"
        exit 1
    }
    
    Write-SuccessLog "Node.js verificado e pronto para uso"
}

# Verificar e instalar Git
function Install-Git {
    Write-StepLog "Verificando Git..."
    
    try {
        $gitVersion = git --version
        Write-InfoLog "Git já instalado: $gitVersion"
    } catch {
        Write-WarningLog "Git não encontrado. Iniciando instalação..."
        
        # Baixar e instalar Git
        $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.41.0.windows.1/Git-2.41.0-64-bit.exe"
        $gitInstaller = "$env:TEMP\git-installer.exe"
        
        Write-InfoLog "Baixando Git..."
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
        
        Write-InfoLog "Instalando Git..."
        Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART" -Wait
        
        # Verificar instalação
        try {
            $gitVersion = git --version
            Write-SuccessLog "Git instalado: $gitVersion"
        } catch {
            Write-ErrorLog "Falha ao instalar Git. Por favor, instale manualmente de https://git-scm.com/"
            exit 1
        }
    }
    
    Write-SuccessLog "Git verificado e pronto para uso"
}

# Configurar variáveis de ambiente
function Setup-Environment {
    Write-StepLog "Configurando variáveis de ambiente..."
    
    $projectDir = Get-Location
    $envFile = "$projectDir\.env.local"
    
    # Verificar se .env.example existe
    if (-not (Test-Path "$projectDir\.env.example")) {
        Write-ErrorLog "Arquivo .env.example não encontrado. Verifique se você está no diretório correto."
        exit 1
    }
    
    # Verificar se .env.local já existe
    if (Test-Path $envFile) {
        Write-WarningLog "Arquivo .env.local já existe."
        $overwrite = Read-Host "Deseja sobrescrever? (s/N)"
        if ($overwrite -ne "s") {
            Write-InfoLog "Mantendo arquivo .env.local existente."
            return
        }
    }
    
    # Solicitar informações do Supabase
    Write-InfoLog "Configurando conexão com o Supabase..."
    $supabaseUrl = Read-Host "URL do Supabase (ex: http://localhost:8083)"
    $supabaseAnonKey = Read-Host "Chave anônima do Supabase"
    $supabaseServiceKey = Read-Host "Chave de serviço do Supabase"
    
    # Criar arquivo .env.local
    $envContent = @"
# Configuração do JáPede Cardápio
# Gerado automaticamente em $(Get-Date)

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey
SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey

# Environment
NODE_ENV=development
VITE_NODE_ENV=development

# App Configuration
VITE_APP_TITLE=JáPede Cardápio
"@
    
    # Salvar arquivo .env.local
    $envContent | Out-File -FilePath $envFile -Encoding utf8
    
    Write-SuccessLog "Arquivo .env.local criado com sucesso"
}

# Instalar dependências do projeto
function Install-Dependencies {
    Write-StepLog "Instalando dependências do projeto..."
    
    # Verificar se package.json existe
    if (-not (Test-Path "package.json")) {
        Write-ErrorLog "Arquivo package.json não encontrado. Verifique se você está no diretório correto."
        exit 1
    }
    
    # Instalar dependências
    Write-InfoLog "Executando npm install..."
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorLog "Falha ao instalar dependências. Verifique os erros acima."
        exit 1
    }
    
    Write-SuccessLog "Dependências instaladas com sucesso"
}

# Inicializar banco de dados
function Initialize-Database {
    Write-StepLog "Inicializando banco de dados..."
    
    # Verificar se os arquivos necessários existem
    if (-not (Test-Path "supabase_schema.sql") -or -not (Test-Path "supabase_seed_data.sql")) {
        Write-ErrorLog "Arquivos de schema ou dados iniciais não encontrados."
        Write-ErrorLog "Verifique se os arquivos supabase_schema.sql e supabase_seed_data.sql existem."
        exit 1
    }
    
    # Verificar se o arquivo .env.local existe
    if (-not (Test-Path ".env.local")) {
        Write-ErrorLog "Arquivo .env.local não encontrado. Execute a etapa de configuração de ambiente primeiro."
        exit 1
    }
    
    # Executar script de inicialização do banco
    Write-InfoLog "Executando script de inicialização do banco..."
    
    # Verificar se init_database.js existe
    if (Test-Path "init_database.js") {
        node init_database.js
        
        if ($LASTEXITCODE -ne 0) {
            Write-ErrorLog "Falha ao inicializar banco de dados. Verifique os erros acima."
            exit 1
        }
    } else {
        Write-ErrorLog "Arquivo init_database.js não encontrado."
        Write-ErrorLog "Verifique se o arquivo existe no diretório do projeto."
        exit 1
    }
    
    Write-SuccessLog "Banco de dados inicializado com sucesso"
}

# Construir aplicação
function Build-Application {
    Write-StepLog "Construindo aplicação..."
    
    # Executar build
    Write-InfoLog "Executando npm run build..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorLog "Falha ao construir aplicação. Verifique os erros acima."
        exit 1
    }
    
    # Verificar se o diretório dist foi criado
    if (-not (Test-Path "dist")) {
        Write-ErrorLog "Diretório 'dist' não foi criado. Verifique se o build foi bem-sucedido."
        exit 1
    }
    
    Write-SuccessLog "Aplicação construída com sucesso"
}

# Iniciar aplicação
function Start-Application {
    Write-StepLog "Iniciando aplicação..."
    
    # Verificar se o build existe
    if (-not (Test-Path "dist")) {
        Write-WarningLog "Build não encontrado. Executando build primeiro..."
        Build-Application
    }
    
    # Iniciar aplicação
    Write-InfoLog "Executando npm start..."
    Write-InfoLog "A aplicação será iniciada em http://localhost:3001"
    Write-InfoLog "Pressione Ctrl+C para encerrar a aplicação"
    
    npm start
}

# Função principal
function Main {
    Clear-Host
    
    Write-Host "🍕 ===================================" -ForegroundColor Magenta
    Write-Host "   JáPede Cardápio - Instalação Windows" -ForegroundColor Magenta
    Write-Host "===================================" -ForegroundColor Magenta
    Write-Host ""
    
    # Menu de opções
    Write-Host "Escolha uma opção:" -ForegroundColor Cyan
    Write-Host "1. Instalação completa (recomendado)" -ForegroundColor Cyan
    Write-Host "2. Verificar/instalar Node.js e Git" -ForegroundColor Cyan
    Write-Host "3. Configurar variáveis de ambiente" -ForegroundColor Cyan
    Write-Host "4. Instalar dependências" -ForegroundColor Cyan
    Write-Host "5. Inicializar banco de dados" -ForegroundColor Cyan
    Write-Host "6. Construir aplicação" -ForegroundColor Cyan
    Write-Host "7. Iniciar aplicação" -ForegroundColor Cyan
    Write-Host "8. Sair" -ForegroundColor Cyan
    Write-Host ""
    
    $option = Read-Host "Digite o número da opção desejada"
    
    switch ($option) {
        "1" {
            Install-NodeJS
            Install-Git
            Setup-Environment
            Install-Dependencies
            Initialize-Database
            Build-Application
            Start-Application
        }
        "2" {
            Install-NodeJS
            Install-Git
        }
        "3" {
            Setup-Environment
        }
        "4" {
            Install-Dependencies
        }
        "5" {
            Initialize-Database
        }
        "6" {
            Build-Application
        }
        "7" {
            Start-Application
        }
        "8" {
            Write-Host "Saindo..." -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-ErrorLog "Opção inválida. Por favor, escolha uma opção válida."
            Main
        }
    }
    
    # Perguntar se deseja voltar ao menu principal
    Write-Host ""
    $continue = Read-Host "Deseja voltar ao menu principal? (S/n)"
    if ($continue -ne "n") {
        Main
    }
}

# Executar função principal
Main