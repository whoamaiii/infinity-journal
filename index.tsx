import { createRoot } from 'react-dom/client';
import App from '@/App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — app still works fine without it
    });
  });
}
