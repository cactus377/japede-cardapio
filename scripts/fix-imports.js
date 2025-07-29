import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const extensions = ['.ts', '.tsx'];

async function processFile(filePath) {
  try {
    let content = await fs.promises.readFile(filePath, 'utf8');
    let changed = false;

    // Corrige imports relativos para @/
    const importRegex = /from\s+['"](?:\.\.\/)+([^'"]+)['"]/g;
    const newContent = content.replace(importRegex, (match, importPath) => {
      // Não modifica imports de node_modules
      if (importPath.startsWith('@/') || 
          importPath.startsWith('http') || 
          importPath.startsWith('.') || 
          importPath.startsWith('/') ||
          !importPath.includes('/')) {
        return match;
      }
      
      changed = true;
      return `from '@/${importPath}'`;
    });

    if (changed) {
      await fs.promises.writeFile(filePath, newContent, 'utf8');
      console.log(`✅ Updated: ${path.relative(projectRoot, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

async function processDirectory(directory) {
  try {
    const files = await fs.promises.readdir(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = await fs.promises.stat(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
        await processDirectory(fullPath);
      } else if (extensions.includes(path.extname(file).toLowerCase())) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${directory}:`, error.message);
  }
}

// Função principal auto-executada
(async () => {
  try {
    console.log('🚀 Starting import path fixes...');
    await processDirectory(projectRoot);
    console.log('✨ Finished fixing import paths!');
  } catch (error) {
    console.error('❌ An error occurred:', error);
    process.exit(1);
  }
})();
