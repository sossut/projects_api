FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm ci

COPY . .

ENV NODE_ENV=development
EXPOSE 5000

CMD ["npm","run","dev"]