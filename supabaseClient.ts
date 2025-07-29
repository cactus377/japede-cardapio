
import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';

// Buscar variáveis de ambiente usando import.meta.env
// Certifique-se de ter um arquivo .env.local (ou similar) na raiz do projeto com:
// NEXT_PUBLIC_SUPABASE_URL=SUA_URL_SUPABASE
// NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE

const supabaseUrl = (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `CRÍTICO: Supabase URL ou Anon Key não foram carregadas. 
  Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY 
  estão definidas no seu arquivo .env (ex: .env.local para Vite) e se o servidor Vite foi reiniciado.
  URL Recebida: ${supabaseUrl}
  Chave Anon Recebida: ${Boolean(supabaseAnonKey)}`; // Boolean para não logar a chave em si
  console.error(errorMessage);
  // Mostra um alerta visível na tela se o erro for no navegador
  if (typeof window !== 'undefined') {
    alert(errorMessage);
  }
  throw new Error(errorMessage);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper for handling Supabase errors
export const handleSupabaseError = (error: PostgrestError | Error | null | undefined, customMessage?: string): Error => {
  const operationDescription = customMessage || 'Operação com Supabase falhou';
  let errorDetails = 'Erro desconhecido.';

  if (error) {
    if ('message' in error) {
        errorDetails = error.message;
        // Supabase PostgREST errors often have more specific details
        if ('details' in error && error.details && typeof error.details === 'string') errorDetails += ` Detalhes: ${error.details}`;
        if ('hint' in error && error.hint && typeof error.hint === 'string') errorDetails += ` Dica: ${error.hint}`;
        if ('code' in error && error.code && typeof error.code === 'string') errorDetails += ` Código: ${error.code}`;
    } else if (typeof error === 'string') {
        errorDetails = error;
    }
  }

  console.error(`[SupabaseClient] ${operationDescription}. Erro: ${errorDetails}`, error);
  return new Error(`${operationDescription}. ${errorDetails}`);
};