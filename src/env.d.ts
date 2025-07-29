/// <reference types="vite/client" />

// Declare modules for aliases
declare module '@components/*';
declare module '@pages/*';
declare module '@contexts/*';
declare module '@services/*';
declare module '@utils/*';
declare module '@types';

// Declare environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
