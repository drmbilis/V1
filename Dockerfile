FROM node:18-alpine AS base

# Backend builder
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN apk add --no-cache python3 make g++ libc6-compat
RUN npm ci --omit=dev --no-audit --no-fund || (echo "---- NPM LOGS ----" && ls -la /root/.npm/_logs || true && cat /root/.npm/_logs/* || true && exit 1)
COPY backend/ ./

# Production stage
FROM base AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy backend
COPY --from=backend-builder /app/backend ./backend

WORKDIR /app/backend

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "src/server.js"]
