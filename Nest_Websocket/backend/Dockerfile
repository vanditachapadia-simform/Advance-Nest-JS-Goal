# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app and Prisma artifacts from builder with correct ownership
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nestjs:nodejs --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --chown=nestjs:nodejs prisma ./prisma

# Give nestjs user ownership of node_modules so prisma migrate can write at runtime
RUN chown -R nestjs:nodejs /app/node_modules

USER nestjs
EXPOSE 3000

CMD ["node", "dist/main"]
