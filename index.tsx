
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';

console.log('[index.tsx] Script execution started. Mounting React application...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[index.tsx] CRITICAL: Root element not found in DOM.');
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
console.log('[index.tsx] React application mounted.');
