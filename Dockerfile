FROM node:22.15-alpine AS runtime

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN addgroup -g 1001 -S node-group && \
    adduser -S node-usr -u 1001 -G node-group

RUN apk add --no-cache curl

USER node-usr
EXPOSE 3000

CMD ["node", "index.js"]