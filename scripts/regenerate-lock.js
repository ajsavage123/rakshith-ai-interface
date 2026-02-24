import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

try {
  console.log('[v0] Regenerating package-lock.json...');
  console.log('[v0] Working directory:', projectRoot);
  
  // Remove existing lock file if it exists
  try {
    execSync('rm -f package-lock.json', { 
      cwd: projectRoot,
      stdio: 'inherit' 
    });
  } catch (e) {
    console.log('[v0] No existing lock file to remove');
  }
  
  // Regenerate lock file from package.json
  execSync('npm install --package-lock-only --legacy-peer-deps', { 
    cwd: projectRoot,
    stdio: 'inherit' 
  });
  
  console.log('[v0] Package lock file regenerated successfully!');
} catch (error) {
  console.error('[v0] Error regenerating lock file:', error.message);
  process.exit(1);
}
