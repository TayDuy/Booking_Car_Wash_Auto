import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Tách các thư viện lớn, ít đổi ra chunk riêng để trình duyệt cache
    // độc lập với code app, và trang đầu không phải tải thư viện chưa cần.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/react-router-dom|\/react\/|\/react-dom\//.test(id)) return 'react-vendor';
          if (id.includes('bootstrap')) return 'bootstrap-vendor';
          if (id.includes('@supabase')) return 'supabase-vendor';
          if (id.includes('react-icons') || id.includes('lucide-react')) return 'icons-vendor';
          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})