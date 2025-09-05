FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

CMD ["npx", "pm2-runtime", "start", "app.js", "--name", "tgbot"]