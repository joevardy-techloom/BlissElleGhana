import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Sanity boundary: Catch other iframe cross-origin & popup-blocked failures elegantly
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || '';
    const reasonStr = typeof reason === 'object' ? reason.message || reason.stack || '' : String(reason);
    if (
      reasonStr.includes('INTERNAL ASSERTION FAILED') ||
      reasonStr.includes('Pending promise was never set') ||
      reasonStr.includes('popup-blocked') ||
      reasonStr.includes('cancelled-popup-request') ||
      reasonStr.includes('auth/popup-blocked') ||
      reasonStr.includes('auth/cancelled-popup-request')
    ) {
      console.warn("Gracefully filtered sandboxed Firebase Auth popup error:", reasonStr);
      event.preventDefault(); // Prevent standard overlay crash
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.includes('INTERNAL ASSERTION FAILED') ||
      message.includes('Pending promise was never set') ||
      message.includes('popup-blocked') ||
      message.includes('cancelled-popup-request') ||
      message.includes('auth/popup-blocked') ||
      message.includes('auth/cancelled-popup-request')
    ) {
      console.warn("Gracefully filtered sandboxed Firebase Auth crash event:", message);
      event.preventDefault(); // Prevent standard overlay crash
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

