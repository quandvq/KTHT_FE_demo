import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/KTHT_FE_demo/' : '/',
  plugins: [react()],
}));
