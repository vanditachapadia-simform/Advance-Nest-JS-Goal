# ============================================================
# Multi-stage Dockerfile for the Enterprise Logistics Platform
# ============================================================

# ---- Stage 1: build ----
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies (cached layer when lockfile unchanged)
COPY package*.json ./
RUN npm install

# Build the application
COPY . .
RUN npm run build

# ---- Stage 2: production runtime ----
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Only production dependencies in the final image
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled output from the builder
COPY --from=builder /usr/src/app/dist ./dist

# Runtime upload directory
RUN mkdir -p uploads && mkdir -p logs

EXPOSE 3000
# Default command runs the HTTP gateway; microservices override `command` in compose.
CMD ["node", "dist/main"]
