const fs = require('fs');
const path = require('path');

// Diretório raiz do projeto
const rootDir = path.resolve(__dirname, '..');

// Extensões de arquivo para processar
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

// Função para processar um arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Substituir caminhos relativos por alias @/
    const updatedContent = content.replace(
      /from\s+['"](?:\.\.\/)+([^'"]+)['"]/g,
      (match, importPath) => {
        // Ignorar imports de node_modules
        if (importPath.startsWith('@/') || importPath.startsWith('.') || importPath.includes('node_modules')) {
          return match;
        }
        
        // Verificar se o caminho relativo aponta para um arquivo no projeto
        const fullPath = path.resolve(path.dirname(filePath), importPath);
        const relativeToRoot = path.relative(rootDir, fullPath);
        
        if (fs.existsSync(fullPath) || fs.existsSync(`${fullPath}.ts`) || fs.existsSync(`${fullPath}.tsx`)) {
          modified = true;
          return `from '@/${relativeToRoot.replace(/\\/g, '/')}'`;
        }
        
        return match;
      }
    );

    // Se o conteúdo foi modificado, salvar o arquivo
    if (modified) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${path.relative(rootDir, filePath)}`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
  return false;
}

// Função para percorrer diretórios recursivamente
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  let updatedCount = 0;

  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignorar node_modules e outros diretórios desnecessários
      if (['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
        return;
      }
      updatedCount += processDirectory(fullPath);
    } else if (fileExtensions.includes(path.extname(file).toLowerCase())) {
      if (processFile(fullPath)) {
        updatedCount++;
      }
    }
  });

  return updatedCount;
}

console.log('Updating import paths to use @/ alias...');
const updatedFiles = processDirectory(rootDir);
console.log(`\n✅ Updated ${updatedFiles} files to use @/ alias.`);
