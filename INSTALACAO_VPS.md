# 🍕 Guia de Instalação VPS - JáPede Cardápio

## Pré-requisitos

### 1. VPS Configurada
- Ubuntu 20.04+ ou Debian 11+
- Mínimo 2GB RAM, 20GB SSD
- Acesso root via SSH

### 2. Supabase via Easypanel
- Supabase já instalado e configurado no Easypanel
- URL do Supabase: `http://seu-ip:porta` ou domínio personalizado
- Chave de API anônima configurada

### 3. Domínio (Opcional)
- Domínio apontando para o IP da VPS
- SSL/TLS configurado (Let's Encrypt)

## Instalação Passo a Passo

### 1. Conectar na VPS
```bash
ssh root@seu-ip-da-vps
# ou
ssh usuario@seu-ip-da-vps
```

### 2. Atualizar Sistema
```bash
apt update && apt upgrade -y
```

### 3. Instalar Dependências Base
```bash
apt install -y curl wget git nginx nodejs npm build-essential
```

### 4. Instalar Node.js (versão LTS)
```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

# Verificar versões
node --version
npm --version
```

### 5. Configurar Firewall
```bash
ufw enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw status
```

### 6. Clonar e Configurar Projeto
```bash
# Ir para diretório web
cd /var/www

# Clonar projeto (substitua pela sua URL)
git clone https://github.com/seu-usuario/japede-cardapio.git
cd japede-cardapio

# Instalar dependências
npm install

# Criar arquivo de ambiente
cp .env.example .env.local
nano .env.local
```

### 7. Configurar Variáveis de Ambiente (.env.local)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://seu-supabase-easypanel:porta
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-supabase

# Se usando domínio personalizado para Supabase:
# NEXT_PUBLIC_SUPABASE_URL=https://supabase.seudominio.com
```

### 8. Build da Aplicação
```bash
npm run build
```

### 9. Configurar Nginx
```bash
# Criar configuração do site
nano /etc/nginx/sites-available/japede-cardapio
```

**Conteúdo do arquivo Nginx:**
```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;
    root /var/www/japede-cardapio/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### 10. Ativar Site
```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/japede-cardapio /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
```

### 11. Configurar SSL (Let's Encrypt)
```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d seudominio.com -d www.seudominio.com

# Configurar renovação automática
crontab -e
# Adicionar linha:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 12. Configurar PM2 (Opcional - para servir via Node.js)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Servir aplicação
pm2 serve dist 3000 --name japede-cardapio --spa

# Salvar configuração PM2
pm2 save
pm2 startup
```

## Configuração do Supabase (Easypanel)

### 1. Acessar Easypanel
- URL: `http://seu-ip:3000` (porta padrão do Easypanel)
- Login com suas credenciais

### 2. Configurar Supabase
1. **Database Settings:**
   - Definir senha do PostgreSQL
   - Configurar porta de acesso

2. **API Settings:**
   - Gerar/configurar JWT Secret
   - Definir chave de API anônima
   - Configurar CORS para seu domínio

3. **Storage Settings:**
   - Configurar bucket público se necessário
   - Definir políticas de acesso

### 3. Importar Schema do Banco
```bash
# Conectar no PostgreSQL do Supabase
psql -h localhost -p porta-supabase -U postgres -d postgres

# Ou via interface do Supabase
# Ir em: Database > SQL Editor
# Executar os scripts de migração
```

## Manutenção e Atualizações

### 1. Atualizar Aplicação
```bash
cd /var/www/japede-cardapio
git pull origin main
npm install
npm run build
systemctl reload nginx
```

### 2. Backup
```bash
# Backup do código
tar -czf backup-japede-$(date +%Y%m%d).tar.gz /var/www/japede-cardapio

# Backup do banco (via Supabase/Easypanel)
# Use as ferramentas do Easypanel para backup do PostgreSQL
```

### 3. Logs
```bash
# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PM2 logs (se usando)
pm2 logs japede-cardapio
```

## Solução de Problemas

### 1. Erro 404 nas rotas
- Verificar configuração `try_files` no Nginx
- Confirmar se o build foi executado corretamente

### 2. Erro de CORS
- Verificar configuração CORS no Supabase
- Adicionar domínio nas configurações permitidas

### 3. Variáveis de ambiente não carregadas
- Verificar se o arquivo `.env.local` está correto
- Rebuildar a aplicação após alterações

### 4. Problemas de conexão com Supabase
- Verificar se o Supabase está rodando no Easypanel
- Testar conectividade: `curl http://supabase-url/rest/v1/`
- Verificar logs do Supabase no Easypanel

### 5. Erro de parsing JSON no package.json
- Se você encontrar erros como `JSON.parse Bad escaped character in JSON` ao executar comandos npm, execute o script de correção:

```bash
# Navegar até o diretório da aplicação
cd /var/www/japede-cardapio

# Executar o script de correção
./fix_package_json.sh

# Ou corrigir manualmente
sed -i 's/\.\\install_windows\.ps1/\.\\\\install_windows\.ps1/g' package.json
```

- Este erro ocorre devido a um problema de escape de backslashes em comandos do Windows no arquivo package.json

## URLs Úteis

- **Aplicação:** `https://seudominio.com`
- **Supabase (Easypanel):** `http://seu-ip:porta-supabase`
- **Easypanel:** `http://seu-ip:3000`

## Comandos Rápidos

```bash
# Status dos serviços
systemctl status nginx
systemctl status postgresql

# Reiniciar serviços
systemctl restart nginx
systemctl restart postgresql

# Ver logs em tempo real
tail -f /var/log/nginx/error.log
journalctl -u nginx -f
```
