/**
 * 全局配置：与 .env.example / docker-compose.yml 同步维护。
 * STORAGE=memory 时使用本地种子数据（默认，便于一键演示）；
 * STORAGE=mysql 时可切换 Prisma 仓储（schema 见 database/init.sql）。
 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  storage: (process.env.STORAGE ?? "memory") as "memory" | "mysql",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    name: process.env.DB_NAME ?? "app_db",
    user: process.env.DB_USER ?? "app_user",
    password: process.env.DB_PASSWORD ?? "app_password"
  },
  jwtSecret: process.env.JWT_SECRET ?? "local-dev-secret",
  rateLimit: { windowMs: 60_000, max: Number(process.env.RATE_LIMIT_MAX ?? 120) }
};
