FROM node:20-alpine AS builder
WORKDIR /app

# Copia pacotes para o monorepo
COPY package*.json ./
COPY admin-panel/package*.json ./admin-panel/

# Usamos npm install para resolver os workspaces corretamente
RUN npm install

# Copia todo o código-fonte
COPY . .

# Build do servidor MCP raiz (se aplicável)
RUN npm run build --if-present

# Build do Next.js Painel
WORKDIR /app/admin-panel
RUN npm run build

# Imagem Final
FROM node:20-alpine AS runner
WORKDIR /app

# Instala o Redis nativamente no container
RUN apk add --no-cache redis bash

ENV NODE_ENV=production

# Copia tudo do builder (standalone Next.js)
COPY --from=builder /app /app

# Prepara os diretórios do Redis
RUN mkdir -p /var/run/redis /var/lib/redis /etc/redis && \
    echo "bind 0.0.0.0" > /etc/redis/redis.conf && \
    echo "daemonize no" >> /etc/redis/redis.conf && \
    chown -R node:node /var/run/redis /var/lib/redis /etc/redis

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Porta do Next.js e Porta do Redis (Backend local precisa acessar o BullMQ)
EXPOSE 3000
EXPOSE 6379

# Executa o script que sobe Redis e Next.js simultaneamente
ENTRYPOINT ["/app/entrypoint.sh"]
