// This file helps with module resolution in development
// It ensures all module aliases are properly resolved

import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves a module path using the project's base directory
 * @param modulePath The path to resolve
 * @returns The resolved path
 */
export function resolveModule(modulePath: string): string {
  const baseDir = path.resolve(__dirname, '../..');
  return path.resolve(baseDir, modulePath);
}

// Export common paths
export const paths = {
  components: resolveModule('components'),
  pages: resolveModule('pages'),
  contexts: resolveModule('contexts'),
  services: resolveModule('services'),
  utils: resolveModule('utils'),
  types: resolveModule('types'),
  assets: resolveModule('assets'),
};

// Log paths for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Module paths resolved:');
  Object.entries(paths).forEach(([key, value]) => {
    console.log(`- ${key}: ${value}`);
  });
}
