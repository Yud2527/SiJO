
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  // Load all environment variables starting with '' (empty string) to include API_KEY
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Direct mapping for cross-environment compatibility
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  };
});
