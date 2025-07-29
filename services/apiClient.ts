
// services/apiClient.ts
import { AlertInfo } from '../types';

const API_BASE_URL = '/api'; // Configure a base URL da sua API de backend

interface ApiErrorResponse {
  message: string;
  errors?: { [key: string]: string[] }; // Para erros de validação
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: any,
  isFormData: boolean = false
): Promise<T> => {
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  console.log(`[apiClient] Request: ${method} ${API_BASE_URL}${endpoint}`, body ? `Payload: ${JSON.stringify(body).substring(0,100)}...` : '(No payload)');


  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 204) { // No Content
        return null as T; // Or handle as appropriate for your app
    }

    const responseData = await response.json();
    console.log(`[apiClient] Response from ${method} ${API_BASE_URL}${endpoint}:`, response.status, responseData);


    if (!response.ok) {
      const errorResponse = responseData as ApiErrorResponse;
      let errorMessage = errorResponse.message || `Erro na requisição: ${response.status} ${response.statusText}`;
      if (errorResponse.errors) {
        // Format validation errors (example)
        const validationErrors = Object.entries(errorResponse.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ');
        errorMessage += ` Detalhes: ${validationErrors}`;
      }
      console.error(`[apiClient] API Error on ${method} ${endpoint}:`, errorMessage, responseData);
      throw new Error(errorMessage);
    }
    return responseData as T;
  } catch (error) {
    console.error(`[apiClient] Network or parsing error on ${method} ${endpoint}:`, error);
    // Ensure re-throwing an actual Error object
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Erro de rede ou ao processar a resposta da API.');
  }
};

export const apiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body: any, isFormData: boolean = false) => request<T>('POST', endpoint, body, isFormData),
  put: <T>(endpoint: string, body: any) => request<T>('PUT', endpoint, body),
  patch: <T>(endpoint: string, body: any) => request<T>('PATCH', endpoint, body),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
};

// Helper function to be used in AppContext for setting alerts
export const handleApiError = (
    error: any,
    setAlertFunction: (alertInfo: AlertInfo | null) => void,
    customMessage?: string
  ) => {
    let message = customMessage || 'Ocorreu um erro.';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    console.error("handleApiError:", message, error);
    setAlertFunction({ message, type: 'error' });
};
