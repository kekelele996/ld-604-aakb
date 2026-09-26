/**
 * 全局配置：.env / docker-compose / 本文件多处同步
 * （新增配置必须同时改 .env.example、docker-compose.yml、此处）。
 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "local-dev-secret",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    name: process.env.DB_NAME ?? "app_db",
    user: process.env.DB_USER ?? "app_user",
    password: process.env.DB_PASSWORD ?? "app_password"
  },
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};
