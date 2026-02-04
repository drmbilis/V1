# Coolify Deployment Guide

## 🚀 Hızlı Deploy (5 Dakika)

### 1️⃣ Coolify'da Yeni Proje Oluştur

1. Coolify Dashboard → **New Resource**
2. **Docker Compose** seç
3. Repository: GitHub repo URL'inizi yapıştırın
4. Branch: `main`
5. Docker Compose File: `docker-compose.production.yml`

### 2️⃣ Environment Variables Ekle

Coolify'da **Environment** tab'ına gidin ve şu değişkenleri ekleyin:

```bash
# Database
DB_NAME=google_ads_ai
DB_USER=postgres
DB_PASSWORD=GÜÇLÜ_ŞİFRE_BURAYA

# Encryption (32+ karakter random string)
ENCRYPTION_KEY=RANDOM_32_KARAKTER_ŞİFRE

# JWT
JWT_SECRET=RANDOM_JWT_SECRET_BURAYA

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN.com/api/v1/auth/google/callback

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CLIENT_ID=your-ads-client-id
GOOGLE_ADS_CLIENT_SECRET=your-ads-client-secret

# AI APIs
GEMINI_API_KEY=your-gemini-key
DEEPSEEK_API_KEY=your-deepseek-key

# Frontend URL
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN.com

# Port
PORT=5000
```

### 3️⃣ Database Migration

Deploy sonrası ilk kez çalıştırın:

```bash
# Coolify terminal'inde veya SSH ile
docker exec -it google-ads-api npm run migrate
```

### 4️⃣ Domain Ayarları

1. Coolify Dashboard → **Domains**
2. Add Domain: `api.your-domain.com`
3. SSL Certificate: **Let's Encrypt** (otomatik)

### 5️⃣ Deploy!

**Deploy** butonuna tıklayın. 2-3 dakika içinde hazır!

---

## 📋 Servis Yapılandırması

### Coolify Resource Types

Bu projede **3 servis** çalışır:

1. **API Server** (`api`)
   - Port: 5000
   - Health check: `/health`
   - Public access: ✅

2. **Background Worker** (`worker`)
   - Port: Yok (internal)
   - BullMQ job processor
   - Public access: ❌

3. **PostgreSQL** (`postgres`)
   - Port: 5432 (internal only)
   - Persistent volume
   - Public access: ❌

4. **Redis** (`redis`)
   - Port: 6379 (internal only)
   - Persistent volume
   - Public access: ❌

### Önerilen Ayarlar

#### API Service
```yaml
Health Check Path: /health
Health Check Interval: 30s
Restart Policy: unless-stopped
CPU Limit: 1 core
Memory Limit: 512MB
```

#### Worker Service
```yaml
Restart Policy: unless-stopped
CPU Limit: 0.5 core
Memory Limit: 256MB
```

#### PostgreSQL
```yaml
Volume Mount: postgres_data:/var/lib/postgresql/data
Backup: Coolify otomatik backup (önerilir)
```

#### Redis
```yaml
Volume Mount: redis_data:/data
Persistence: RDB + AOF
```

---

## 🔧 Alternatif: Manuel Service-by-Service

Eğer docker-compose kullanmak istemezseniz:

### Adım 1: PostgreSQL
1. **New Resource** → **Database** → **PostgreSQL 15**
2. Database Name: `google_ads_ai`
3. Username: `postgres`
4. Password: Güçlü şifre
5. Deploy

### Adım 2: Redis
1. **New Resource** → **Database** → **Redis 7**
2. Persistence: Enabled
3. Deploy

### Adım 3: API Service
1. **New Resource** → **Docker Image**
2. Build Type: **Dockerfile**
3. Dockerfile: `Dockerfile`
4. Port: 5000
5. Environment Variables: (yukarıdaki listeyi ekle)
6. Health Check: `/health`
7. Deploy

### Adım 4: Worker Service
1. **New Resource** → **Docker Image**
2. Build Type: **Dockerfile**
3. Dockerfile: `Dockerfile.worker`
4. Environment Variables: (API ile aynı)
5. Deploy

---

## 🔐 Google OAuth Callback URL

Google Cloud Console'da Authorized Redirect URIs:
```
https://api.your-domain.com/api/v1/auth/google/callback
```

---

## 📊 Monitoring

### Logs
```bash
# API logs
docker logs -f google-ads-api

# Worker logs
docker logs -f google-ads-worker

# PostgreSQL logs
docker logs -f google-ads-postgres
```

### Health Checks
```bash
# API health
curl https://api.your-domain.com/health

# Database check
docker exec google-ads-postgres psql -U postgres -d google_ads_ai -c "SELECT COUNT(*) FROM tenants;"

# Redis check
docker exec google-ads-redis redis-cli ping
```

---

## 🔄 Updates & Deployments

### Auto-deploy on Git Push
Coolify → **Settings** → **Auto Deploy**: ✅ Enable

Her git push sonrası otomatik deploy olur.

### Manual Deploy
Coolify Dashboard → **Deploy** butonu

### Rollback
Coolify Dashboard → **Deployments** → Previous deployment seç → **Redeploy**

---

## 🛡️ Güvenlik

### Firewall Rules
- Port 5000: API (HTTPS ile public)
- Port 5432: PostgreSQL (internal only)
- Port 6379: Redis (internal only)

### Coolify'da otomatik:
- ✅ SSL/TLS (Let's Encrypt)
- ✅ Network isolation
- ✅ Secret management
- ✅ Automatic restarts

---

## 💾 Backup

### Database Backup (Coolify)
1. PostgreSQL service → **Backups**
2. Enable automatic backups
3. Frequency: Daily
4. Retention: 7 days

### Manual Backup
```bash
# PostgreSQL dump
docker exec google-ads-postgres pg_dump -U postgres google_ads_ai > backup.sql

# Redis backup
docker exec google-ads-redis redis-cli SAVE
```

---

## 🐛 Troubleshooting

### API won't start
```bash
# Check logs
docker logs google-ads-api

# Common issues:
# - Database connection failed → Check DB_HOST, DB_PASSWORD
# - Redis connection failed → Check REDIS_HOST
# - Missing env vars → Check Coolify environment variables
```

### Worker not processing jobs
```bash
# Check worker logs
docker logs google-ads-worker

# Check Redis
docker exec google-ads-redis redis-cli KEYS "bull:sync:*"

# Restart worker
docker restart google-ads-worker
```

### Database migration failed
```bash
# Connect to container
docker exec -it google-ads-api sh

# Run migration manually
npm run migrate

# Check tables
docker exec google-ads-postgres psql -U postgres -d google_ads_ai -c "\dt"
```

---

## 📈 Scaling

### Horizontal Scaling
Coolify → Service → **Scale**: 2+ instances

API ve Worker servislerini scale edebilirsiniz.

### Vertical Scaling
Coolify → Service → **Resources**
- CPU: 2 cores
- Memory: 1GB

---

## ✅ Production Checklist

- [ ] Environment variables set
- [ ] Database migration completed
- [ ] Google OAuth callback configured
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Auto-deploy enabled
- [ ] Backups configured
- [ ] Monitoring alerts set
- [ ] Worker processing jobs
- [ ] API responding to requests

---

## 🎯 Quick Commands

```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# View all logs
docker-compose -f docker-compose.production.yml logs -f

# Scale worker
docker-compose -f docker-compose.production.yml up -d --scale worker=3

# Stop all
docker-compose -f docker-compose.production.yml down

# Start all
docker-compose -f docker-compose.production.yml up -d
```

---

**Deploy Time:** ~5 dakika
**First Request:** API ready in ~30 seconds
**SSL Certificate:** ~2 dakika (otomatik)

Coolify'da tüm servisler tek tıkla deploy olur! 🚀
