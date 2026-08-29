import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // Required for GitHub Pages
    base: '/Rkh-8888/',

    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // AI Studio development settings
      hmr: process.env.DISABLE_HMR !== 'true',

      // Prevent unnecessary file watching in AI Studio
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
