# API Documentation

Base URL: `http://localhost:5000/api/v1`

All authenticated endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication

### Get Google OAuth URL
```http
GET /auth/google/start
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

### OAuth Callback
```http
GET /auth/google/callback?code=...
```
Redirects to frontend with JWT token.

### Get Current User
```http
GET /auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "tenantMemberships": [...]
  }
}
```

---

## Customers

### List Customers
```http
GET /customers
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "customerId": "1234567890",
      "descriptiveName": "My Company",
      "currency": "USD",
      "status": "active"
    }
  ]
}
```

### Select Active Customer
```http
POST /customers/select
Content-Type: application/json

{
  "customerId": "1234567890"
}
```

### Refresh Customer List
```http
POST /customers/refresh
```
Queues sync job to fetch latest customers from Google Ads.

---

## Campaigns

### List Campaigns
```http
GET /campaigns?customerId=1234567890&status=ENABLED&limit=50
```

**Query Parameters:**
- `customerId` (optional): Filter by customer
- `status` (optional): ENABLED, PAUSED, REMOVED
- `channelType` (optional): SEARCH, DISPLAY, etc.
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "uuid",
      "campaignId": "12345",
      "name": "Summer Sale",
      "status": "ENABLED",
      "channelType": "SEARCH",
      "budget": 50.00,
      "latestMetrics": {
        "impressions": 1000,
        "clicks": 50,
        "conversions": 5
      }
    }
  ]
}
```

### Get Campaign Details
```http
GET /campaigns/:id
```

### Get Campaign Metrics
```http
GET /campaigns/:id/metrics?range=30
```

**Query Parameters:**
- `range` (default: 30): Number of days

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign": {...},
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-30",
      "days": 30
    },
    "summary": {
      "totalImpressions": 10000,
      "totalClicks": 500,
      "totalCost": 1500.00,
      "totalConversions": 50,
      "avgCtr": 5.0,
      "avgCpc": 3.00,
      "conversionRate": 10.0,
      "roas": 3.5
    },
    "daily": [
      {
        "date": "2024-01-30",
        "impressions": 500,
        "clicks": 25,
        "cost": 75.00,
        "conversions": 2
      }
    ]
  }
}
```

### Get Campaigns by Customer
```http
GET /campaigns/customer/:customerId
```

---

## Sync Jobs

### Trigger Sync
```http
POST /jobs/sync
Content-Type: application/json

{
  "customerId": "1234567890",
  "type": "sync_campaigns"
}
```

**Sync Types:**
- `sync_campaigns`: Sync campaign structure
- `sync_metrics_daily`: Sync last 30 days metrics
- Omit `type` to sync both

**Response:**
```json
{
  "success": true,
  "message": "Queued 2 sync job(s)",
  "data": {
    "jobs": [
      {
        "id": "job-id-1",
        "type": "sync_campaigns",
        "status": "queued"
      }
    ]
  }
}
```

### Get Sync Status
```http
GET /jobs/sync/status?customerId=1234567890
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": "1234567890",
    "lastCampaignSync": "2024-01-30T10:00:00Z",
    "lastMetricsSync": "2024-01-30T10:05:00Z",
    "status": "active",
    "accountStatus": "active",
    "error": null
  }
}
```

### Sync All Customers (Admin only)
```http
POST /jobs/sync-all
```

---

## Recommendations

### Generate AI Recommendations
```http
POST /recommendations/generate
Content-Type: application/json

{
  "campaignId": "uuid",
  "types": ["keyword", "adcopy", "budget", "pause"],
  "goal": "conversions"
}
```

**Recommendation Types:**
- `keyword`: Keyword suggestions
- `adcopy`: Ad copy variations
- `budget`: Budget optimization
- `pause`: Should campaign be paused

**Response:**
```json
{
  "success": true,
  "message": "Generated 3 recommendation(s)",
  "data": [
    {
      "id": "uuid",
      "type": "budget",
      "proposalJson": {
        "currentBudget": 50.00,
        "recommendedBudget": 60.00,
        "changePercent": 20
      },
      "rationale": "Campaign performing well, budget is limiting impressions",
      "confidence": 0.85,
      "expectedImpactJson": {
        "impressions": "+15%",
        "clicks": "+12%",
        "conversions": "+8%"
      },
      "riskLevel": "medium",
      "status": "draft"
    }
  ]
}
```

### List Recommendations
```http
GET /recommendations?customerId=1234&status=draft&type=budget
```

**Query Parameters:**
- `customerId` (optional)
- `status` (optional): draft, approved, applied, rejected
- `type` (optional): keyword, adcopy, budget, pause
- `limit` (default: 50)
- `offset` (default: 0)

### Get Recommendation
```http
GET /recommendations/:id
```

### Approve Recommendation
```http
POST /recommendations/:id/approve
```

Requires: `admin` or `member` role

### Reject Recommendation
```http
POST /recommendations/:id/reject
```

### Deep Analysis (DeepSeek)
```http
POST /recommendations/analyze
Content-Type: application/json

{
  "campaignId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trend": "improving",
    "trendStrength": 0.75,
    "anomalies": [...],
    "predictions": {...},
    "insights": ["Insight 1", "Insight 2"],
    "confidence": 0.8
  }
}
```

---

## Apply Operations

### Dry Run
```http
POST /apply/recommendations/:id/dry-run
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "budget",
    "campaignId": "12345",
    "changes": [
      {
        "field": "daily_budget",
        "from": 50.00,
        "to": 60.00,
        "change": "+20.0%"
      }
    ],
    "warnings": ["Budget increase exceeds 20%"],
    "validationPassed": true
  }
}
```

Requires: `admin` or `member` role

### Apply Recommendation (Admin only)
```http
POST /apply/recommendations/:id
Content-Type: application/json
Idempotency-Key: unique-key-123

{
  "confirmDryRun": true
}
```

**First call (without confirmDryRun):**
```json
{
  "success": false,
  "requiresConfirmation": true,
  "message": "Please review dry-run results and confirm",
  "dryRun": {...},
  "confirmationRequired": {
    "field": "confirmDryRun",
    "value": true,
    "idempotencyKey": "generated-key"
  }
}
```

**Second call (with confirmDryRun: true):**
```json
{
  "success": true,
  "message": "Recommendation applied successfully",
  "data": {
    "success": true,
    "applyRun": {...},
    "changes": {...}
  }
}
```

Requires: `admin` role only

**Idempotency:**
- Include `Idempotency-Key` header to prevent duplicate applies
- Same key returns same result without re-applying

### Get Apply Runs
```http
GET /apply/runs?limit=50
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "uuid",
      "recommendationId": "uuid",
      "status": "success",
      "appliedChanges": {...},
      "appliedBy": "user-uuid",
      "createdAt": "2024-01-30T10:00:00Z"
    }
  ]
}
```

### Get Apply Run Details
```http
GET /apply/runs/:id
```

### Get Audit Log
```http
GET /apply/audit?limit=100&action=campaign.budget
```

**Query Parameters:**
- `limit` (default: 100)
- `offset` (default: 0)
- `action` (optional): campaign.budget, campaign.pause, etc.
- `targetType` (optional): campaign, ad_group, etc.

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": "uuid",
      "action": "campaign.budget",
      "targetType": "campaign",
      "targetId": "12345",
      "beforeJson": {"budget": 50},
      "afterJson": {"budget": 60},
      "actorUserId": "user-uuid",
      "success": true,
      "createdAt": "2024-01-30T10:00:00Z"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Roles & Permissions

### Roles
- `admin`: Full access (can apply recommendations)
- `member`: Read/write (can approve recommendations)
- `viewer`: Read-only

### Permission Matrix

| Endpoint | Admin | Member | Viewer |
|----------|-------|--------|--------|
| GET (all) | ✅ | ✅ | ✅ |
| POST /sync | ✅ | ✅ | ❌ |
| POST /recommendations/generate | ✅ | ✅ | ❌ |
| POST /recommendations/:id/approve | ✅ | ✅ | ❌ |
| POST /apply/* | ✅ | ❌ | ❌ |

---

## Guardrails

### Budget Changes
- Maximum change: 30% (configurable via `MAX_BUDGET_CHANGE_PERCENT`)
- Minimum budget: $5/day (configurable via `MIN_DAILY_BUDGET`)

### Apply Operations
- Idempotency protection
- Dry-run required before apply
- Admin role required
- Full audit logging

### Rate Limiting
- Configured per environment
- Default: 100 requests per 15 minutes

---

## Webhooks (Future)

Coming in future releases:
- Campaign performance alerts
- Recommendation ready notifications
- Apply completion webhooks
