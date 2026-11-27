FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node index.js ./

ENV HOST=0.0.0.0
ENV PORT=8080

USER node

EXPOSE 8080

CMD ["node", "index.js"]
