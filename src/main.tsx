import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedInitialDataIfEmpty } from './services/storageService';

// Initialize seed data if storage is empty
seedInitialDataIfEmpty();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
