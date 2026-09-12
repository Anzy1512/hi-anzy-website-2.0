import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = { '/api': { target: env.LOCAL_API_URL || 'http://127.0.0.1:8111', changeOrigin: true } };
  return {
    envPrefix: ['VITE_', 'REACT_APP_'],
    plugins: [
      {
        name: 'existing-jsx-files', enforce: 'pre',
        async transform(code, id) {
          if (/\/src\/.*\.js$/.test(id)) return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
        },
      },
      react(),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
    build: { outDir: 'build', sourcemap: false },
    server: { proxy },
    preview: { proxy },
    test: { include: ['src/**/*.test.{js,jsx}'], maxWorkers: 2, environment: 'jsdom', setupFiles: ['./src/test-setup.js'], restoreMocks: true },
  };
});
