import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Para obter o __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initDatabase() {
  try {
    console.log('Iniciando a configuração do banco de dados...');

    // Lê o arquivo de esquema SQL
    const schemaPath = path.join(__dirname, 'supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Executa o esquema SQL
    console.log('Aplicando esquema do banco de dados...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (schemaError) {
      console.error('Erro ao aplicar o esquema:', schemaError);
      process.exit(1);
    }

    // Lê o arquivo de dados iniciais SQL
    const seedPath = path.join(__dirname, 'supabase_seed_data.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');

    // Executa o SQL de dados iniciais
    console.log('Inserindo dados iniciais...');
    const { error: seedError } = await supabase.rpc('exec_sql', { sql: seedData });
    
    if (seedError) {
      console.error('Erro ao inserir dados iniciais:', seedError);
      process.exit(1);
    }

    console.log('Banco de dados configurado com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar o banco de dados:', error);
    process.exit(1);
  }
}

// Executa a função de inicialização
initDatabase();