FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate || true
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# wget 用于 compose healthcheck（busybox 自带，显式安装保证可用）
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
