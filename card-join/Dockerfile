# Образ крошечный и собирается мгновенно: внутри нет npm install —
# сервер работает на чистом Node.js, библиотеки интерфейса лежат в public/vendor.
FROM node:20-alpine
ENV PORT=8080
WORKDIR /app
COPY server.js ./
COPY public ./public
USER node
EXPOSE 8080
CMD ["node", "server.js"]
