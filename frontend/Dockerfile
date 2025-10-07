# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

# Build assets so preview server can serve the compiled SPA
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4173

# Vite preview escucha en 0.0.0.0 (todas las interfaces) y respeta PORT
CMD ["sh", "-c", "npm run preview -- --host --port ${PORT:-4173}"]
