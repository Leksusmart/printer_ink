# === ЭТАП 1: СБОРКА ПРИЛОЖЕНИЯ ===
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходники и собираем проект (создается папка dist)
COPY . .
RUN npm run build

# === ЭТАП 2: ЗАПУСК В ПРОДАКШЕНЕ ===
FROM node:20-alpine AS runner
WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем ТОЛЬКО продакшен-зависимости (без nest-cli, typescript и т.д.)
# Это уменьшит размер контейнера в несколько раз
RUN npm install --omit=dev

# Копируем скомпилированный код из первого этапа
COPY --from=builder /app/dist ./dist

# Бэкенд по умолчанию будет работать на порту 3000 внутри контейнера
EXPOSE 3000

# Запускаем готовый JavaScript код
CMD ["node", "dist/main.js"]
