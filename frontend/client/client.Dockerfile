# === ЭТАП 1: СБОРКА ПРИЛОЖЕНИЯ ===
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем только файлы зависимостей
COPY package*.json ./

# Устанавливаем ВСЕ зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Передаём переменные из .env
ARG CLIENT_URL
ENV CLIENT_URL=${CLIENT_URL}
ARG PORT_BACKEND
ENV PORT_BACKEND=${PORT_BACKEND}

# Собираем оптимизированное продакшен-приложение (создается папка .next)
RUN npm run build


# === ЭТАП 2: МИНИМАЛЬНЫЙ ОБРАЗ ДЛЯ ЗАПУСКА ===
FROM node:20-alpine AS runner
WORKDIR /app

# Переносим только результаты сборки и то, что нужно для работы сервера
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Запускаем
CMD ["npx", "next", "start"]