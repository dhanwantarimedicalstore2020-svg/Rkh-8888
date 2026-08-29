import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedInitialDataIfEmpty } from './services/storageService';

// Initialize seed data if storage is empty
seedInitialDataIfEmpty();

// Safe Service Worker Registration for Offline & PWA Support
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || '/'}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        if (import.meta.env.DEV) {
          console.log('[SW] Service Worker registered with scope:', registration.scope);
        }
      })
      .catch((error) => {
        // Defensive error boundary: never crash the application on SW failure
        console.warn('[SW] Service Worker registration skipped or failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
