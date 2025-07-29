# Configuração Detalhada do Supabase para JáPede Cardápio

Este documento fornece instruções detalhadas para configurar o Supabase para uso com o JáPede Cardápio, incluindo a instalação, configuração e manutenção do banco de dados.

## Índice

1. [Visão Geral](#visão-geral)
2. [Opções de Instalação do Supabase](#opções-de-instalação-do-supabase)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Configuração Inicial](#configuração-inicial)
5. [Segurança e Permissões](#segurança-e-permissões)
6. [Backup e Restauração](#backup-e-restauração)
7. [Manutenção](#manutenção)
8. [Solução de Problemas](#solução-de-problemas)

## Visão Geral

O JáPede Cardápio utiliza o Supabase como banco de dados e backend. O Supabase é uma alternativa open-source ao Firebase, oferecendo:

- Banco de dados PostgreSQL
- Autenticação e autorização
- API RESTful automática
- Armazenamento de arquivos
- Funções em tempo real

Para o JáPede Cardápio, utilizamos principalmente o banco de dados PostgreSQL e a API RESTful.

## Opções de Instalação do Supabase

Existem três opções principais para usar o Supabase com o JáPede Cardápio:

### 1. Supabase Cloud (Hospedado)

A maneira mais simples é usar o serviço hospedado do Supabase:

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Obtenha as credenciais (URL e chaves)
4. Configure o JáPede Cardápio para usar essas credenciais

**Vantagens:**
- Sem necessidade de instalação ou manutenção
- Backups automáticos
- Escalabilidade automática

**Desvantagens:**
- Pode ter custos para projetos maiores
- Dependência de serviço externo

### 2. Supabase Self-Hosted com Docker

Você pode hospedar o Supabase em seu próprio servidor usando Docker:

```bash
# Instalar Docker e Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Clonar o repositório do Supabase
git clone https://github.com/supabase/supabase
cd supabase/docker

# Configurar variáveis de ambiente
cp .env.example .env

# Editar o arquivo .env com suas configurações
nano .env
```

Edite o arquivo `.env` com as seguintes configurações:

```
############
# Secrets - Gere strings aleatórias seguras para cada uma destas variáveis
############

POSTGRES_PASSWORD=sua_senha_postgres
JWT_SECRET=seu_segredo_jwt_aleatorio
ANON_KEY=sua_chave_anon_aleatoria
SERVICE_ROLE_KEY=sua_chave_service_aleatoria
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=senha_admin_segura

############
# Database - Você pode alterar estas configurações conforme necessário
############

POSTGRES_PORT=5432

############
# API - Você pode alterar estas configurações conforme necessário
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# Studio - Você pode alterar estas configurações conforme necessário
############

STUDIO_PORT=8083
```

Inicie o Supabase:

```bash
docker-compose up -d
```

**Vantagens:**
- Controle total sobre os dados
- Sem custos de hospedagem externa
- Pode funcionar offline

**Desvantagens:**
- Requer manutenção
- Requer conhecimento de Docker
- Requer servidor com recursos adequados

### 3. Supabase via EasyPanel

Se você estiver usando o EasyPanel em seu VPS, pode instalar o Supabase como uma aplicação:

1. Acesse o painel do EasyPanel
2. Adicione uma nova aplicação e selecione Supabase
3. Configure as variáveis de ambiente conforme necessário
4. Inicie a aplicação

## Estrutura do Banco de Dados

O JáPede Cardápio utiliza as seguintes tabelas no Supabase:

### Tabelas Principais

- **categories**: Categorias de itens do cardápio
  - `id`: UUID (chave primária)
  - `name`: Nome da categoria
  - `description`: Descrição da categoria
  - `image_url`: URL da imagem da categoria
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **menu_items**: Itens do cardápio
  - `id`: UUID (chave primária)
  - `category_id`: ID da categoria (chave estrangeira)
  - `name`: Nome do item
  - `description`: Descrição do item
  - `price`: Preço do item
  - `image_url`: URL da imagem do item
  - `is_pizza`: Indica se o item é uma pizza
  - `is_available`: Indica se o item está disponível
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **pizza_sizes**: Tamanhos de pizza disponíveis
  - `id`: UUID (chave primária)
  - `menu_item_id`: ID do item do cardápio (chave estrangeira)
  - `name`: Nome do tamanho
  - `price_multiplier`: Multiplicador de preço
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **pizza_crusts**: Tipos de bordas de pizza
  - `id`: UUID (chave primária)
  - `menu_item_id`: ID do item do cardápio (chave estrangeira)
  - `name`: Nome da borda
  - `price_addition`: Adição de preço
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **tables**: Mesas do estabelecimento
  - `id`: UUID (chave primária)
  - `number`: Número da mesa
  - `name`: Nome da mesa
  - `is_active`: Indica se a mesa está ativa
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **orders**: Pedidos realizados
  - `id`: UUID (chave primária)
  - `table_id`: ID da mesa (chave estrangeira)
  - `status`: Status do pedido (pending, preparing, ready, delivered, cancelled, paid)
  - `total`: Valor total do pedido
  - `payment_method`: Método de pagamento
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **order_items**: Itens incluídos em cada pedido
  - `id`: UUID (chave primária)
  - `order_id`: ID do pedido (chave estrangeira)
  - `menu_item_id`: ID do item do cardápio (chave estrangeira)
  - `quantity`: Quantidade
  - `unit_price`: Preço unitário
  - `total_price`: Preço total
  - `notes`: Observações
  - `pizza_size_id`: ID do tamanho da pizza (opcional)
  - `pizza_crust_id`: ID da borda da pizza (opcional)
  - `half_and_half`: Indica se é meia a meia
  - `second_flavor_id`: ID do segundo sabor (opcional)
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **cash_register_sessions**: Sessões de caixa
  - `id`: UUID (chave primária)
  - `opening_amount`: Valor de abertura
  - `closing_amount`: Valor de fechamento
  - `expected_amount`: Valor esperado
  - `difference`: Diferença
  - `status`: Status da sessão (open, closed)
  - `opened_at`: Data de abertura
  - `closed_at`: Data de fechamento
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **cash_adjustments**: Ajustes de caixa
  - `id`: UUID (chave primária)
  - `session_id`: ID da sessão de caixa (chave estrangeira)
  - `amount`: Valor do ajuste
  - `type`: Tipo do ajuste (add, remove)
  - `reason`: Motivo do ajuste
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- **system_settings**: Configurações do sistema
  - `id`: UUID (chave primária)
  - `key`: Chave da configuração
  - `value`: Valor da configuração
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

## Configuração Inicial

### Usando o Script de Configuração

A maneira mais fácil de configurar o banco de dados é usar o script `configure_supabase.sh`:

```bash
chmod +x ./configure_supabase.sh
./configure_supabase.sh <SUPABASE_URL> <SUPABASE_SERVICE_KEY> [SCHEMA_FILE] [SEED_FILE]
```

Exemplo:

```bash
./configure_supabase.sh http://localhost:8083 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ./supabase_schema.sql ./supabase_seed_data.sql
```

### Configuração Manual

Se preferir configurar manualmente, siga estas etapas:

1. Acesse o SQL Editor no painel do Supabase
2. Execute o arquivo `supabase_schema.sql` para criar as tabelas
3. Execute o arquivo `supabase_seed_data.sql` para inserir dados iniciais

Ou via linha de comando:

```bash
# Instalar cliente PostgreSQL
sudo apt install -y postgresql-client

# Executar schema e dados iniciais
psql -h localhost -p 5432 -U postgres -d postgres -f supabase_schema.sql
psql -h localhost -p 5432 -U postgres -d postgres -f supabase_seed_data.sql
```

## Segurança e Permissões

O Supabase utiliza Row Level Security (RLS) para controlar o acesso aos dados. No entanto, o JáPede Cardápio não implementa autenticação de usuários por padrão, utilizando apenas a chave anônima para acesso.

Se você deseja implementar autenticação e controle de acesso, será necessário:

1. Ativar RLS nas tabelas
2. Criar políticas de acesso
3. Implementar autenticação no frontend

Exemplo de ativação de RLS e criação de políticas (já incluído como comentário no `supabase_schema.sql`):

```sql
-- Ativar RLS na tabela orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura anônima
CREATE POLICY "Permitir leitura anônima de orders" ON orders
    FOR SELECT
    TO anon
    USING (true);

-- Criar política para permitir inserção anônima
CREATE POLICY "Permitir inserção anônima em orders" ON orders
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Criar política para permitir atualização anônima
CREATE POLICY "Permitir atualização anônima de orders" ON orders
    FOR UPDATE
    TO anon
    USING (true);
```

## Backup e Restauração

### Backup Manual

Para fazer backup do banco de dados manualmente:

```bash
# Backup completo
pg_dump -h localhost -p 5432 -U postgres -d postgres -F c -f backup.dump

# Backup apenas do schema
pg_dump -h localhost -p 5432 -U postgres -d postgres --schema-only -f schema.sql

# Backup apenas dos dados
pg_dump -h localhost -p 5432 -U postgres -d postgres --data-only -f data.sql
```

### Restauração Manual

Para restaurar o banco de dados a partir de um backup:

```bash
# Restaurar backup completo
pg_restore -h localhost -p 5432 -U postgres -d postgres -c backup.dump

# Restaurar apenas o schema
psql -h localhost -p 5432 -U postgres -d postgres -f schema.sql

# Restaurar apenas os dados
psql -h localhost -p 5432 -U postgres -d postgres -f data.sql
```

### Backup Automatizado

O script `setup_database.sh` inclui uma função para backup automatizado. Você pode executá-la diretamente:

```bash
./setup_database.sh backup
```

Ou configurar um cron job para executar backups periódicos:

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 3h da manhã
0 3 * * * /caminho/para/setup_database.sh backup
```

## Manutenção

### Verificação de Integridade

Para verificar a integridade do banco de dados:

```bash
# Verificar se o banco está inicializado
./setup_database.sh check

# Verificar tabelas manualmente
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT count(*) FROM categories;"
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT count(*) FROM menu_items;"
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT count(*) FROM tables;"
```

### Limpeza de Dados Antigos

Para limpar pedidos antigos e manter o banco de dados otimizado:

```sql
-- Arquivar pedidos antigos (mais de 3 meses)
CREATE TABLE IF NOT EXISTS archived_orders (LIKE orders INCLUDING ALL);
INSERT INTO archived_orders SELECT * FROM orders WHERE created_at < NOW() - INTERVAL '3 months';
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE created_at < NOW() - INTERVAL '3 months');
DELETE FROM orders WHERE created_at < NOW() - INTERVAL '3 months';

-- Limpar sessões de caixa antigas
CREATE TABLE IF NOT EXISTS archived_cash_register_sessions (LIKE cash_register_sessions INCLUDING ALL);
INSERT INTO archived_cash_register_sessions SELECT * FROM cash_register_sessions WHERE closed_at < NOW() - INTERVAL '6 months';
DELETE FROM cash_adjustments WHERE session_id IN (SELECT id FROM cash_register_sessions WHERE closed_at < NOW() - INTERVAL '6 months');
DELETE FROM cash_register_sessions WHERE closed_at < NOW() - INTERVAL '6 months';
```

### Otimização de Performance

Para otimizar a performance do banco de dados:

```sql
-- Analisar tabelas para otimizar consultas
VACUUM ANALYZE;

-- Reindexar tabelas
REINDEX TABLE orders;
REINDEX TABLE order_items;
REINDEX TABLE menu_items;
```

## Solução de Problemas

### Problema: Erro ao conectar com o Supabase

**Verificações:**

1. Verifique se o Supabase está rodando:
   ```bash
   # Se instalado via Docker
   sudo docker ps | grep supabase
   
   # Se instalado via EasyPanel
   # Verifique no painel do EasyPanel
   ```

2. Verifique se as credenciais estão corretas:
   ```bash
   # Teste a conexão com curl
   curl -s -H "apikey: sua-chave-anonima" http://localhost:8083/rest/v1/
   ```

3. Verifique os logs do Supabase:
   ```bash
   # Se instalado via Docker
   sudo docker logs supabase_kong_1
   sudo docker logs supabase_db_1
   ```

### Problema: Erro ao executar scripts SQL

**Verificações:**

1. Verifique se os arquivos SQL existem e têm permissão de leitura:
   ```bash
   ls -la supabase_schema.sql supabase_seed_data.sql
   ```

2. Verifique se há erros de sintaxe nos arquivos SQL:
   ```bash
   # Validar sintaxe SQL
   psql -h localhost -p 5432 -U postgres -d postgres -f supabase_schema.sql --echo-all
   ```

3. Verifique se o banco de dados já está inicializado:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories');"
   ```

### Problema: Tabelas não estão sendo criadas

**Verificações:**

1. Verifique se o usuário tem permissões para criar tabelas:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres -c "\du"
   ```

2. Verifique se há conflitos de nome de tabela:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
   ```

3. Tente criar uma tabela de teste manualmente:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE TABLE test_table (id serial PRIMARY KEY, name text);"
   ```

---

Este guia detalhado deve ajudar na configuração e manutenção do Supabase para o JáPede Cardápio. Se você encontrar problemas específicos não cobertos aqui, consulte a documentação oficial do Supabase em [supabase.com/docs](https://supabase.com/docs) ou abra uma issue no repositório do projeto.