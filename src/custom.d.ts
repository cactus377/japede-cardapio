// Type definitions for module aliases
declare module '@components/*' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '@pages/*' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '@contexts/*' {
  const context: any;
  export default context;
}

declare module '@services/*' {
  const service: any;
  export default service;
}

declare module '@utils/*' {
  const util: any;
  export default util;
}

declare module '@types' {
  const types: any;
  export default types;
}

// For SVG imports
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// For CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  }
}

// For Vite's import.meta.env
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
