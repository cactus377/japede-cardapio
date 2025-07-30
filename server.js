import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Para obter o __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Configuração do Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_MODEL_NAME = 'gemini-pro';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

// Endpoint para gerar descrições usando o Gemini API
app.post('/api/generate-description', async (req, res) => {
  try {
    const { itemName } = req.body;
    
    if (!itemName) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const prompt = `Crie uma descrição atraente e detalhada para um item de cardápio chamado "${itemName}". A descrição deve ter entre 100 e 150 caracteres e destacar os principais ingredientes e características do prato.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ description: text.trim() });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ 
      error: 'Failed to generate description', 
      details: error.message 
    });
  }
});

// Servir arquivos estáticos do build em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});