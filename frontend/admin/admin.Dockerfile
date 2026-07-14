FROM node:20-alpine

WORKDIR /app

# Копируем зависимости конкретно для админки
COPY package*.json ./

RUN npm install

# Копируем исходный код админки
COPY . .

# Админка работает на порту 3002
EXPOSE 3002

# В package.json админки скрипт dev должен запускать Next на порту 3002
# Пример в package.json: "dev": "next dev -p 3002"
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
