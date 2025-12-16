# ------------------------------
# STAGE 1 — BUILD DO FRONTEND
# ------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Recebe valor vindo do docker-compose
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .

# O Vite SEMPRE lê .env
RUN echo "VITE_API_URL=$VITE_API_URL" > .env

RUN npm run build

# ------------------------------
# STAGE 2 — SERVE VIA NGINX
# ------------------------------
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
