FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

CMD ["pm2", "start"]