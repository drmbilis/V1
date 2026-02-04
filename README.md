# Google Ads AI Platform - MVP

AI-powered Google Ads management platform following vertical slice architecture.

## 🎯 MVP Scope (4 Vertical Slices)

### Dilim 0: Temel İskelet ✅
- PostgreSQL + Redis + Node.js
- Docker Compose setup
- Health check endpoint

### Dilim 1: Auth + Tenant + Google Connect ✅
- Google OAuth 2.0
- Multi-tenant architecture
- Encrypted token storage
- Customer list sync

### Dilim 2: Read-only Dashboard ✅
- Campaign sync (BullMQ jobs)
- Daily metrics storage
- Dashboard API endpoints
- Last 30 days data with analytics

### Dilim 3: AI Recommendations ✅
- Keyword suggestions (Gemini)
- Ad copy generation (Gemini)
- Budget optimization with guardrails
- Performance analysis (DeepSeek)
- Approve/Reject workflow

### Dilim 4: Controlled Apply ✅
- Campaign pause/resume
- Budget updates (30% max change)
- Dry-run preview
- Idempotency protection
- Full audit logging
- Admin-only access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Google Cloud project with Ads API enabled
- Gemini API key
- DeepSeek API key

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Start Infrastructure
```bash
# Start PostgreSQL & Redis
docker compose up -d

# Verify services are running
docker compose ps
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

**Required .env values:**
```env
# Database (default values work with docker-compose)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=google_ads_ai
DB_USER=postgres
DB_PASSWORD=postgres

# Encryption (generate a 32+ char random string)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_ads_client_id
GOOGLE_ADS_CLIENT_SECRET=your_ads_client_secret

# AI APIs
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=your_deepseek_key
```

### 4. Initialize Database
```bash
npm run migrate
```

### 5. Start Services
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Background Workers
npm run worker
```

Server runs on: `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection
│   │   └── redis.js             # Redis connection
│   ├── modules/
│   │   ├── auth/                # Authentication
│   │   │   ├── user.model.js
│   │   │   ├── auth.routes.js
│   │   │   └── googleAuth.service.js
│   │   ├── tenants/             # Multi-tenancy
│   │   │   ├── tenant.model.js
│   │   │   └── tenant-user.model.js
│   │   ├── google/              # Google Ads integration
│   │   │   ├── google-account.model.js
│   │   │   ├── google-customer.model.js
│   │   │   ├── campaign.model.js
│   │   │   ├── campaign-metrics-daily.model.js
│   │   │   └── googleAds.client.js
│   │   ├── recommendations/     # AI recommendations
│   │   │   └── recommendation.model.js
│   │   ├── audit/               # Audit trail
│   │   │   └── audit-log.model.js
│   │   ├── apply/               # Apply operations
│   │   │   └── apply-run.model.js
│   │   └── jobs/                # BullMQ queues
│   │       └── queues.js
│   ├── workers/                 # Background workers
│   │   ├── sync.worker.js       # Sync campaigns/metrics
│   │   └── index.js
│   ├── middleware/
│   │   └── auth.js              # JWT + tenant middleware
│   ├── utils/
│   │   ├── jwt.js
│   │   └── encryption.js        # Token encryption
│   ├── models/
│   │   └── index.js             # Model relationships
│   ├── db/
│   │   └── migrate.js           # Migration script
│   └── server.js                # Express app
├── package.json
├── .env.example
└── docker-compose.yml
```

## 🔑 API Endpoints (All Implemented)

### Authentication
```
GET  /api/v1/auth/google/start      - Get OAuth URL
GET  /api/v1/auth/google/callback   - OAuth callback
POST /api/v1/auth/logout            - Logout
GET  /api/v1/auth/me                - Current user
```

### Customers
```
GET  /api/v1/customers              - List Google Ads customers
GET  /api/v1/customers/:id          - Get customer details
POST /api/v1/customers/select       - Select active customer
POST /api/v1/customers/refresh      - Refresh customer list
```

### Campaigns
```
GET  /api/v1/campaigns                      - List campaigns
GET  /api/v1/campaigns/:id                  - Get campaign
GET  /api/v1/campaigns/:id/metrics          - Get metrics (30 days)
GET  /api/v1/campaigns/customer/:id         - Campaigns by customer
```

### Sync Jobs
```
POST /api/v1/jobs/sync              - Trigger sync
GET  /api/v1/jobs/sync/status       - Get sync status
POST /api/v1/jobs/sync-all          - Sync all (admin)
```

### AI Recommendations
```
POST /api/v1/recommendations/generate       - Generate with AI
GET  /api/v1/recommendations                - List recommendations
GET  /api/v1/recommendations/:id            - Get recommendation
POST /api/v1/recommendations/:id/approve    - Approve
POST /api/v1/recommendations/:id/reject     - Reject
POST /api/v1/recommendations/analyze        - Deep analysis
```

### Apply Operations
```
POST /api/v1/apply/recommendations/:id/dry-run  - Preview changes
POST /api/v1/apply/recommendations/:id          - Apply (admin)
GET  /api/v1/apply/runs                         - Apply history
GET  /api/v1/apply/runs/:id                     - Get apply details
GET  /api/v1/apply/audit                        - Audit log
```

### Health
```
GET  /health                        - Service health check
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details.

## 🗄️ Database Schema

### Core Tables
- `tenants` - Workspace/organization
- `users` - User accounts
- `tenant_users` - User-tenant membership with roles
- `google_accounts` - OAuth tokens (encrypted)
- `google_customers` - Google Ads accounts
- `campaigns` - Campaign snapshots
- `campaign_metrics_daily` - Daily performance data
- `recommendations` - AI-generated suggestions
- `audit_logs` - Change history
- `apply_runs` - Apply operation tracking

### Key Relationships
```
Tenant 1:N GoogleAccount
Tenant 1:N GoogleCustomer
Tenant 1:N Campaign
Tenant 1:N TenantUser
User 1:N TenantUser
Campaign 1:N CampaignMetricsDaily
```

## 🔐 Security Features

- **Encrypted refresh tokens** using AES encryption
- **Multi-tenant isolation** at database level
- **JWT with tenant context**
- **Role-based access control** (admin/member/viewer)
- **Audit logging** for all changes
- **Idempotency keys** for apply operations
- **Rate limiting** (ready for implementation)

## 🛡️ Guardrails (MVP)

```javascript
// Budget changes limited to 30%
MAX_BUDGET_CHANGE_PERCENT=30

// Minimum budget protection
MIN_DAILY_BUDGET=5

// Apply operations require admin role
// Audit logs track all changes
// Idempotency prevents duplicate applies
```

## 🧪 Testing

### Manual Testing with Postman

Import the Postman collection:
```bash
# Import postman_collection.json in Postman
# Set variables:
# - base_url: http://localhost:5000/api/v1
# - token: (get from OAuth flow)
# - customer_id: (your Google Ads customer ID)
```

### Testing Flow

1. **Authentication:**
```bash
GET /auth/google/start
# Visit the OAuth URL, complete authentication
# Extract JWT token from callback
```

2. **Sync Data:**
```bash
POST /customers/refresh
POST /jobs/sync
# Wait for jobs to complete (~30 seconds)
GET /jobs/sync/status
```

3. **View Campaigns:**
```bash
GET /campaigns?customerId=YOUR_CUSTOMER_ID
GET /campaigns/:id/metrics?range=30
```

4. **Generate AI Recommendations:**
```bash
POST /recommendations/generate
# Body: { "campaignId": "uuid", "types": ["budget"] }
GET /recommendations?status=draft
```

5. **Apply Recommendation:**
```bash
POST /recommendations/:id/approve
POST /apply/recommendations/:id/dry-run
POST /apply/recommendations/:id
# Body: { "confirmDryRun": true }
```

6. **View Audit:**
```bash
GET /apply/audit
GET /apply/runs
```

### Health Checks
```bash
# Check database connection
curl http://localhost:5000/health

# Check Redis (direct)
redis-cli ping

# Check PostgreSQL
docker exec -it google-ads-postgres psql -U postgres -d google_ads_ai -c "SELECT COUNT(*) FROM tenants;"

# View BullMQ jobs
redis-cli
> KEYS bull:sync:*
> LRANGE bull:sync:completed 0 -1
```

## 📊 BullMQ Jobs

### Sync Queue
- `sync_customers` - Fetch accessible Google Ads accounts
- `sync_campaigns` - Sync campaign structure
- `sync_metrics_daily` - Fetch last 30 days metrics

### Job Monitoring
```bash
# View job status in Redis
redis-cli
> KEYS bull:sync:*
```

## 🚧 Development Status

### ✅ Completed (MVP)
- [x] Docker setup
- [x] Database models (10 tables)
- [x] Google OAuth & token encryption
- [x] Multi-tenant architecture
- [x] Sync workers (BullMQ)
- [x] Campaign & metrics API
- [x] Gemini AI integration
- [x] DeepSeek analytics
- [x] Recommendation engine
- [x] Approval workflow
- [x] Budget updates with guardrails
- [x] Campaign pause/resume
- [x] Dry-run mode
- [x] Idempotency protection
- [x] Full audit logging
- [x] Role-based permissions

### 🚀 Next Steps
- [ ] Frontend Dashboard (Next.js)
- [ ] Real-time notifications
- [ ] Scheduled recommendations
- [ ] Email alerts
- [ ] Shopify app
- [ ] WooCommerce plugin
- [ ] Advanced bidding strategies
- [ ] Automated rules engine

## 🐛 Troubleshooting

### Database connection failed
```bash
# Check PostgreSQL is running
docker compose ps

# Check connection
docker compose logs postgres

# Restart services
docker compose restart
```

### Redis connection error
```bash
# Check Redis is running
docker compose logs redis

# Test connection
redis-cli ping
```

### OAuth redirect mismatch
- Ensure `GOOGLE_REDIRECT_URI` in .env matches Google Console
- Default: `http://localhost:5000/api/v1/auth/google/callback`

## 📝 License

MIT

## 🤝 Contributing

This is an MVP project. Follow the vertical slice approach:
1. Pick a slice (Dilim 1-4)
2. Complete end-to-end (UI → API → Worker → DB)
3. Test thoroughly
4. Move to next slice

---

**Built with:** Node.js • PostgreSQL • Redis • BullMQ • Google Ads API • Gemini • DeepSeek
