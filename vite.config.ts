import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const repoName = process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/KTHT_FE_demo/';

  return {
    base: process.env.VITE_BASE_URL || (command === 'build' ? repoName : '/'),
    plugins: [react()],
    server: { host: true, allowedHosts: true },
  };
});
