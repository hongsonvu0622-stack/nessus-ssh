const { spawn, execSync } = require('child_process');
const fs = require('fs');
const electron = require('electron');

console.log('⏳ Waiting 2.5s for API & Vite dev servers to start...');
setTimeout(() => {
  if (typeof electron === 'string' && !fs.existsSync(electron)) {
    console.log('🔧 Electron binary missing. Restoring automatically...');
    try {
      execSync('node node_modules/electron/install.js', { stdio: 'inherit' });
    } catch (err) {
      console.error('Failed to reinstall electron binary:', err);
    }
  }
  console.log('🚀 Launching Electron Desktop Window...');
  const proc = spawn(electron, ['.'], { stdio: 'inherit' });
  proc.on('close', (code) => process.exit(code || 0));
}, 2500);
