
import { GoogleGenAI } from "@google/genai";
// To use HarmCategory and HarmBlockThreshold, uncomment the line below and ensure they are used.
// import { HarmCategory, HarmBlockThreshold } from "@google/genai";

// Standard CORS headers. Adjust 'Access-Control-Allow-Origin' for production.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or your specific frontend URL e.g., 'http://localhost:5173'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST for invoking and OPTIONS for preflight
};

console.log('Supabase Edge Function: generate-description initialized.');

// IMPORTANT: Set your GEMINI_API_KEY in the Supabase Edge Function environment variables.
// In Supabase dashboard, this should be set as an environment variable named API_KEY for this function.
// @ts-ignore: Deno is a global provided by the Supabase Edge Function environment
const GEMINI_API_KEY = Deno.env.get("API_KEY");

let ai: GoogleGenAI | null = null;

if (!GEMINI_API_KEY) {
  console.error("[Critical] Gemini API Key (API_KEY) is not set in Edge Function environment variables.");
  // ai remains null, and the handler will return an error if a POST request is made.
} else {
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log("GoogleGenAI client initialized successfully in Edge Function.");
  } catch (e) {
    console.error("Error initializing GoogleGenAI client in Edge Function:", e);
    ai = null; // Ensure ai is null if initialization fails
  }
}

async function handler(req: Request): Promise<Response> {
  console.log(`Request received: ${req.method} ${req.url}`);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (preflight).");
    return new Response('ok', { headers: corsHeaders });
  }

  // Ensure API client is available
  if (!ai) {
    console.error("Gemini AI client not available. Possibly due to missing API_KEY.");
    return new Response(
      JSON.stringify({ error: "AI service configuration error on server." }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 503 Service Unavailable
    );
  }
  
  let itemName;
  try {
    // Supabase Functions pass the request body directly if it's JSON.
    // Ensure the client sends 'Content-Type: application/json'.
    const body = await req.json();
    itemName = body.itemName;
    console.log("Request body parsed (JSON), itemName:", itemName);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response(
      JSON.stringify({ error: "Invalid request body. Expecting JSON with 'itemName'." }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!itemName || typeof itemName !== 'string' || itemName.trim() === "") {
    console.log("Invalid itemName received:", itemName);
    return new Response(
      JSON.stringify({ error: "itemName is required and must be a non-empty string." }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const modelName = 'gemini-2.5-flash-preview-04-17';
  // The prompt includes instructions for length and tone.
  const prompt = `Crie uma descrição curta e apetitosa para um item de cardápio chamado "${itemName}". Máximo de 150 caracteres, ideal para um cardápio digital.`;
  console.log(`Generating content for model: ${modelName} with prompt for item: "${itemName}"`);

  try {
    const genAIResponse = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // Optional: Add safetySettings or generationConfig if needed
      // config: { temperature: 0.7, topP: 0.9, topK: 40 } // Example config
    });
    
    const description = genAIResponse.text; // Accessing .text directly
    console.log("Gemini API response received. Description:", description);

    if (description === undefined || description === null || description.trim() === "") {
        console.warn("Gemini API returned an empty or undefined description for:", itemName);
        // Return success with an empty description, or a specific message.
        return new Response(
          JSON.stringify({ description: "Não foi possível gerar uma descrição automática para este item." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ description: description.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    let errorMessage = "Falha ao gerar descrição com IA.";
    if (error instanceof Error) {
        errorMessage = error.message; // Use the actual error message if available
    }
    // Check for specific error types or messages if the SDK provides them
    // For example, API key errors, quota errors, etc.
    if ((error as any)?.message?.includes('API key not valid')) {
        errorMessage = "Chave da API Gemini inválida ou não configurada corretamente no servidor.";
    } else if ((error as any)?.message?.includes('quota')) {
        errorMessage = "Cota da API Gemini excedida. Tente novamente mais tarde.";
    }

    return new Response(
      JSON.stringify({ error: `Erro ao processar sua solicitação com IA: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Deno.serve is the standard way to start an HTTP server in Deno (used by Supabase Edge Functions)
// @ts-ignore: Deno is a global provided by the Supabase Edge Function environment
Deno.serve(handler);

console.log("generate-description Edge Function is ready to serve requests.");
