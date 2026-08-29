import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // Relative base ensures compatibility across GitHub Pages (/Rkh-8888/) and Capacitor Android local asset bundling
    base: './',

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
