const { spawn } = require('child_process');
const electron = require('electron');

console.log('⏳ Waiting 2.5s for API & Vite dev servers to start...');
setTimeout(() => {
  console.log('🚀 Launching Electron Desktop Window...');
  const proc = spawn(electron, ['.'], { stdio: 'inherit' });
  proc.on('close', (code) => process.exit(code || 0));
}, 2500);
