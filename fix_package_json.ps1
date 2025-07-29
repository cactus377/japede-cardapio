# Script para corrigir o arquivo package.json do JáPede Cardápio
# Este script corrige o problema de escape de backslashes no arquivo package.json

# Função para exibir mensagens
function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )

    $Color = @{
        "INFO" = "Cyan"
        "SUCCESS" = "Green"
        "ERROR" = "Red"
    }

    Write-Host "[$Type] $Message" -ForegroundColor $Color[$Type]
}

# Verificar se o arquivo package.json existe
if (-not (Test-Path "package.json")) {
    Write-Log "Arquivo package.json não encontrado no diretório atual" -Type "ERROR"
    exit 1
}

# Fazer backup do arquivo original
Write-Log "Criando backup do arquivo package.json"
Copy-Item -Path "package.json" -Destination "package.json.bak" -Force

# Ler o conteúdo do arquivo
Write-Log "Lendo o arquivo package.json"
$content = Get-Content -Path "package.json" -Raw

# Corrigir o problema de escape de backslashes
Write-Log "Corrigindo o arquivo package.json"
$correctedContent = $content -replace '(\.\\)install_windows\.ps1', '.\\\\install_windows.ps1'

# Salvar o arquivo corrigido
Set-Content -Path "package.json" -Value $correctedContent

# Verificar se a correção foi aplicada
$newContent = Get-Content -Path "package.json" -Raw
if ($newContent -match '\.\\\\install_windows\.ps1') {
    Write-Log "Arquivo package.json corrigido com sucesso" -Type "SUCCESS"
} else {
    Write-Log "Falha ao corrigir o arquivo package.json" -Type "ERROR"
    Write-Log "Restaurando backup..."
    Copy-Item -Path "package.json.bak" -Destination "package.json" -Force
    exit 1
}

Write-Log "Processo concluído. Agora você pode executar os comandos npm sem erros de parsing JSON." -Type "SUCCESS"