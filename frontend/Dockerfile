# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build assets so preview server can serve the compiled SPA
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4173

# Render injecta PORT; usamos 4173 por defecto para local
CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT:-4173}"]
