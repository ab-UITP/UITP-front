# Сервер на чистом Node.js, без npm install.
FROM node:22-alpine
ENV PORT=3000
WORKDIR /app
COPY server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
