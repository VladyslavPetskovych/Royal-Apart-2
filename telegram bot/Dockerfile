FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i && && npm install -g pm2

COPY . .

CMD ["pm2", "start"]