import { apiClient, handleApiError } from './apiClient'; 
import { GEMINI_API_ENDPOINT } from '../constants';
import { AlertInfo } from '../types'; // Assuming AlertInfo might be used by a caller

/**
 * Generates a product description using the Gemini API via a custom backend endpoint.
 * @param itemName The name of the item to generate a description for.
 * @returns A promise that resolves to the generated description string.
 * @throws An error if the item name is empty, or if the API call fails.
 */
export const generateDescription = async (itemName: string): Promise<string> => {
  if (!itemName || itemName.trim() === "") {
    throw new Error("Nome do item não pode ser vazio para gerar descrição.");
  }

  try {
    console.log(`[geminiService] Calling backend endpoint '${GEMINI_API_ENDPOINT}' for item: ${itemName}`);
    
    // The backend endpoint is expected to return { description: string } or { error: string }
    const response = await apiClient.post<{ description?: string; error?: string }>(
        GEMINI_API_ENDPOINT, 
        { itemName }
    );

    if (response.error) {
      console.error(`[geminiService] Backend returned an error:`, response.error);
      throw new Error(`Erro da IA (via backend): ${response.error}`);
    }

    if (!response.description || typeof response.description !== 'string') {
      console.warn(`[geminiService] Backend response missing description or invalid format:`, response);
      throw new Error("A IA (via backend) não retornou uma descrição válida.");
    }
    
    console.log(`[geminiService] Description received from backend:`, response.description);
    return response.description.trim();

  } catch (error) {
    console.error(`[geminiService] Final error in generateDescription for '${itemName}':`, error);
    if (error instanceof Error) {
        throw error; 
    }
    throw new Error("Erro desconhecido ao se comunicar com o serviço de IA via backend.");
  }
};
