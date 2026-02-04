# ... (başlangıç aynı)
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN apk add --no-cache python3 make g++ libc6-compat
RUN npm ci --omit=dev
# Sadece gerekli olan backend klasörünün içeriğini kopyalıyoruz
COPY backend/ . 

# Production stage
FROM base AS production
WORKDIR /app
RUN apk add --no-cache dumb-init

# Dosyaları kopyalarken hiyerarşiyi koru
COPY --from=backend-builder /app/backend /app/backend

# Çalışma dizinini netleştir
WORKDIR /app/backend

# Kullanıcı işlemleri
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app/backend
USER nodejs

EXPOSE 5000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]