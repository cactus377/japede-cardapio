# JáPede Cardápio

Sistema de cardápio digital para restaurantes e estabelecimentos de comida.

## Requisitos

- Node.js 18.x ou superior
- NPM 9.x ou superior
- Supabase (conta gratuita ou self-hosted)
- Chave de API do Google Gemini (opcional, para geração de descrições)

## Configuração

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd japede-cardapio
```

2. Configure o arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase

# Google Gemini API (opcional)
GEMINI_API_KEY=sua_chave_api_do_gemini

# Environment
NODE_ENV=development
VITE_NODE_ENV=development

# App Configuration
VITE_APP_TITLE=JáPede Cardápio
```

3. Instale as dependências e configure o banco de dados:

```bash
npm run setup
```

Este comando irá:
- Instalar todas as dependências do projeto
- Inicializar o banco de dados Supabase com o esquema e dados iniciais
- Construir a aplicação para produção

## Desenvolvimento

Para iniciar o ambiente de desenvolvimento:

```bash
npm run dev:full
```

Este comando inicia:
- O servidor de desenvolvimento Vite para o frontend (porta 5173)
- O servidor Express para o backend (porta 3001)

Você também pode iniciar cada um separadamente:

```bash
npm run dev          # Apenas o frontend
npm run dev:server   # Apenas o backend
```

## Produção

Para construir a aplicação para produção:

```bash
npm run build
```

Para iniciar o servidor em modo de produção:

```bash
npm run start
```

### Instalação em VPS

Para instalar em um servidor VPS Linux, você pode usar o script de instalação automatizado:

```bash
chmod +x ./deploy_to_vps.sh
sudo ./deploy_to_vps.sh <SUPABASE_ANON_KEY> <SUPABASE_SERVICE_KEY> <POSTGRES_PASSWORD> <JWT_SECRET> <DASHBOARD_USERNAME> <DASHBOARD_PASSWORD> <SECRET_KEY_BASE> <VAULT_ENC_KEY>
```

Este script irá:
- Atualizar o sistema
- Instalar Node.js, Nginx e outras dependências
- Configurar o firewall
- Clonar e configurar o projeto
- Configurar o Nginx para servir a aplicação
- Configurar o banco de dados
- Configurar o PM2 para gerenciar a aplicação
- Criar scripts de utilitários para manutenção

### Configuração do Supabase

Para configurar o banco de dados Supabase, você pode usar o script de configuração:

```bash
chmod +x ./configure_supabase.sh
./configure_supabase.sh <SUPABASE_URL> <SUPABASE_SERVICE_KEY> [SCHEMA_FILE] [SEED_FILE]
```

Este script irá:
- Testar a conexão com o Supabase
- Verificar se o banco já está inicializado
- Executar o schema do banco de dados
- Executar os dados iniciais (seed data)
- Verificar se a inicialização foi bem-sucedida

## Instalação no Windows

Para instalar no Windows, execute:

```powershell
npm run setup:windows
```

Ou diretamente via PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install_windows.ps1
```

Alternativamente, você pode usar o novo script de configuração interativo:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_windows.ps1
```

Este script oferece um menu interativo com opções para:
- Instalação completa (recomendado)
- Verificar/instalar Node.js e Git
- Configurar variáveis de ambiente
- Instalar dependências
- Inicializar banco de dados
- Construir aplicação
- Iniciar aplicação

## Solução de Problemas

### Erro de Parsing JSON

Se você encontrar um erro de parsing JSON relacionado a caracteres de escape no arquivo package.json, execute um dos scripts de correção:

**No Linux/macOS:**

```bash
./fix_package_json.sh
```

**No Windows:**

```powershell
.\fix_package_json.ps1
```

## Estrutura do Projeto

- `/components` - Componentes React reutilizáveis
- `/pages` - Páginas da aplicação
- `/contexts` - Contextos React para gerenciamento de estado
- `/services` - Serviços para comunicação com APIs
- `/utils` - Funções utilitárias
- `/types` - Definições de tipos TypeScript
- `/assets` - Recursos estáticos (imagens, fontes, etc.)

## Backend

O backend é implementado usando Express.js e serve como:

1. Proxy para o Supabase (banco de dados e autenticação)
2. API para integração com o Google Gemini (geração de descrições)
3. Servidor para a aplicação em produção

## Banco de Dados

O banco de dados é gerenciado pelo Supabase e inclui as seguintes tabelas principais:

- `categories` - Categorias de itens do cardápio
- `menu_items` - Itens do cardápio (pratos, bebidas, etc.)
- `pizza_sizes` - Tamanhos de pizza disponíveis
- `pizza_crusts` - Tipos de bordas de pizza
- `tables` - Mesas do estabelecimento
- `orders` - Pedidos realizados
- `order_items` - Itens incluídos em cada pedido
- `cash_register_sessions` - Sessões de caixa
- `cash_adjustments` - Ajustes de caixa
