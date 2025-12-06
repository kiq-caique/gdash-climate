# GDASH Climate Dashboard (MVP)

Dashboard full-stack para monitorar clima da cidade com:

- Coleta de dados climáticos e criação de registros
- Cálculo de **insights via Python (FastAPI)**
- Armazenamento em **MongoDB**
- Processamento assíncrono via **RabbitMQ + worker em Go**
- Frontend em **React + Tailwind**
- Backend em **NestJS**

> Projeto montado para o desafio **GDASH 2025/02**.

---

## 🔭 Visão geral da arquitetura

**Componentes principais:**

1. **Frontend (`frontend/`)**
   - React + TypeScript + Tailwind
   - Faz login, cria registros de clima e exibe dashboard
   - Chama a API NestJS

2. **Backend (`backend/`)**
   - NestJS + Mongoose
   - Autenticação JWT
   - CRUD de registros de clima
   - Endpoint de **insights** que chama o serviço em Python
   - Endpoint opcional de **fila** que publica mensagens no RabbitMQ

3. **Serviço de Insights em Python (`python-insights/`)**
   - FastAPI
   - Recebe uma lista de registros de clima
   - Calcula média, tendência, índice de conforto e gera resumo em texto

4. **Worker em Go (`go-worker/`)**
   - Consome mensagens da fila `gdash.weather.logs` no RabbitMQ
   - Grava os registros no MongoDB
   - Libera o backend para responder rápido (processamento assíncrono)

5. **Infra**
   - **MongoDB** (local ou Atlas)
   - **RabbitMQ** rodando em container Docker  
     - UI de administração em `http://localhost:15672` (user: `gdash`, pass: `gdash`)

---

## 🗂 Estrutura de pastas

```text
gdash-climate/
├── backend/           # API NestJS (auth, weather, fila)
├── frontend/          # React + Tailwind (dashboard)
├── python-insights/   # FastAPI para insights de clima
├── go-worker/         # Worker em Go que lê da fila
└── docker-compose.rabbit.yml  # Subir RabbitMQ com Docker
