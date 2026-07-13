#!/usr/bin/env node
/**
 * Automatically synchronizes version from .env (APP_VERSION or VERSION)
 * across package.json and client/package.json before any build or release.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

let envVersion = process.env.APP_VERSION || process.env.VERSION;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^(APP_VERSION|VERSION)\s*=\s*(["']?)([^\s"'#]+)\2/);
      if (match) {
        envVersion = match[3].trim();
        break;
      }
    }
  }
}

if (!envVersion) {
  process.exit(0);
}

const cleanVersion = envVersion.replace(/^v/i, '');

// 1. Cập nhật root package.json
const rootPkgPath = path.join(rootDir, 'package.json');
if (fs.existsSync(rootPkgPath)) {
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  if (rootPkg.version !== cleanVersion) {
    rootPkg.version = cleanVersion;
    fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
    console.log(`[sync-version] ✔ Updated root package.json version to: ${cleanVersion}`);
  }
}

// 2. Cập nhật client/package.json
const clientPkgPath = path.join(rootDir, 'client', 'package.json');
if (fs.existsSync(clientPkgPath)) {
  const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
  if (clientPkg.version !== cleanVersion) {
    clientPkg.version = cleanVersion;
    fs.writeFileSync(clientPkgPath, JSON.stringify(clientPkg, null, 2) + '\n');
    console.log(`[sync-version] ✔ Updated client/package.json version to: ${cleanVersion}`);
  }
}
