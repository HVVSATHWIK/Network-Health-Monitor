import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@google/generative-ai'],
  },
  // @ts-expect-error vitest/config types extend vite
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    env: {
      VITE_AI_API_KEY: '',         // empty = no Gemini in tests
      VITE_AI_MODEL: 'test-model',
    },
  },
});
