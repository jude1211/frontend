import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        headers: {
          // Allow Firebase/Google popups to close and communicate with opener
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          // Ensure COEP isn't enforced in dev which can break popup flows
          'Cross-Origin-Embedder-Policy': 'unsafe-none'
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      optimizeDeps: {
        include: ['react-seat-picker'],
        force: true
      },
      build: {
        commonjsOptions: {
          include: [/node_modules/]
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
