import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对路径，方便部署到 GitHub Pages 的 /<repo>/ 子路径
  base: './',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 7275
  }
})
