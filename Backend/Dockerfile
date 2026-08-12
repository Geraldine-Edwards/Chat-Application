FROM node:alpine

WORKDIR /app

COPY . .

RUN npm --omit=dev ci

EXPOSE 3000

ENTRYPOINT ["node", "server.js"]