import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    // Chunking is left to the bundler: grouping every @firebase module into one
    // vendor chunk would drag the Storage SDK back into the public bundle,
    // undoing the admin-only split in src/firebase/storage.ts.
    // The remaining bulk is the Firestore + Auth + App Check SDK, which every
    // page needs; the parts that are admin-only are already split out.
    chunkSizeWarningLimit: 1000,
  },
})
