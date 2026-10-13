import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Phaser nặng khoảng 1,2 MB, chấp nhận được vì game chạy offline.
  build: { chunkSizeWarningLimit: 2000 },
})
