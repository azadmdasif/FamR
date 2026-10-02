import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const INVALID_LEGACY_KEYS = new Set([
  'AIzaSyBoLpLcFZYWLGQPvFLOyb2fjwzvVlGuYts', // old AI Studio default project
  'AIzaSyBfXhftITVMhfTvhauKIZd4WxbdZ0GlRBc', // restricted/revoked key
]);

const resolveCleanKey = (raw?: string): string => {
  if (!raw) return '';
  const match = raw.match(/AIzaSy[A-Za-z0-9_-]{33}/);
  const key = match ? match[0] : raw.trim().replace(/^["']|["']$/g, '').trim();
  if (INVALID_LEGACY_KEYS.has(key)) return '';
  return key;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  let rawKey = env.VITE_FIREBASE_API_KEY || '';

  // In local dev, prioritize .env file over container-injected stale process.env
  const envFilePath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envFilePath)) {
    try {
      const envContent = fs.readFileSync(envFilePath, 'utf-8');
      const envMatch = envContent.match(/VITE_FIREBASE_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
      if (envMatch && envMatch[1]) {
        rawKey = envMatch[1].trim();
      }
    } catch {}
  }

  const cleanApiKey = resolveCleanKey(rawKey);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(cleanApiKey),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
