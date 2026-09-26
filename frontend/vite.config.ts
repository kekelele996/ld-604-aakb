import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// 本地开发时 /api 代理到本机后端（21104 或测试环境变量）；
// 生产（Nginx）由 frontend/nginx.conf 的 location /api/ 反代。
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 20104,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET ?? "http://localhost:21104",
        changeOrigin: true
      }
    }
  }
});
