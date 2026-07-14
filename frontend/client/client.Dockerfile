FROM node:20-alpine

WORKDIR /app

# Копируем зависимости конкретно для клиента
COPY package*.json ./

RUN npm install

# Копируем исходный код клиента
COPY . .

# Клиент работает на порту 3001
EXPOSE 3001

# В package.json клиента скрипт dev должен запускать Next на порту 3001
# Пример в package.json: "dev": "next dev -p 3001"
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
