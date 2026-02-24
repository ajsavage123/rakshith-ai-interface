import { execSync } from 'child_process';

try {
  console.log('[v0] Regenerating package-lock.json...');
  
  // Remove existing lock file if it exists
  try {
    execSync('rm -f package-lock.json', { stdio: 'inherit' });
  } catch (e) {
    // File might not exist
  }
  
  // Regenerate lock file from package.json
  execSync('npm install --package-lock-only', { stdio: 'inherit' });
  
  console.log('[v0] Package lock file regenerated successfully!');
} catch (error) {
  console.error('[v0] Error regenerating lock file:', error.message);
  process.exit(1);
}
