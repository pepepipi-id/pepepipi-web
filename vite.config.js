import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' // 1. Tambahkan import ini

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // 2. Tambahkan fungsi ini di dalam array plugins
  ],
    base: '/', // tambah ini
})