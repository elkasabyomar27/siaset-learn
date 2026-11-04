import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The Windows execution sandbox permits file reads but rejects native realpath.
  // This project has no symlinks; keep logical paths instead of canonicalizing them.
  resolve: { preserveSymlinks: true }
});
