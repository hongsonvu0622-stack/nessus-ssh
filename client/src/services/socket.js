import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true
});

export async function fetchData() {
  const res = await fetch(`${API_BASE}/data`);
  return res.json();
}

export async function saveData(data) {
  const res = await fetch(`${API_BASE}/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchImportConfig() {
  const res = await fetch(`${API_BASE}/ssh/config-import`);
  return res.json();
}

export async function fetchLocalKeys() {
  const res = await fetch(`${API_BASE}/ssh/local-keys`);
  return res.json();
}

export async function generateSshKey(name, type, comment) {
  const res = await fetch(`${API_BASE}/ssh/generate-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, comment })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate key');
  }
  return res.json();
}

export async function importSshKey(name, privateContent, publicContent) {
  const res = await fetch(`${API_BASE}/ssh/import-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, privateContent, publicContent })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to import key');
  }
  return res.json();
}

export async function fetchSerialPorts() {
  const res = await fetch(`${API_BASE}/serial/ports`);
  return res.json();
}

export async function sftpList(config, path = '.') {
  const res = await fetch(`${API_BASE}/sftp/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, path })
  });
  return res.json();
}

export async function sftpRead(config, file) {
  const res = await fetch(`${API_BASE}/sftp/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, file })
  });
  return res.json();
}

export async function sftpWrite(config, file, content) {
  const res = await fetch(`${API_BASE}/sftp/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, file, content })
  });
  return res.json();
}
