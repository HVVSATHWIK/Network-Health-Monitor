import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'meshline', 'three-mesh-bvh'],
          charts: ['recharts'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ai: ['@google/generative-ai'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
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
