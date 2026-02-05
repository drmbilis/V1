# Frontend - Google Ads AI Platform

Next.js 14 + TypeScript + Tailwind CSS

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

App runs on: `http://localhost:3000`

## 📁 Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   │   └── Layout.tsx  # Main layout with sidebar
│   ├── pages/          # Next.js pages (routes)
│   │   └── _app.tsx    # App wrapper
│   ├── lib/            # Utilities
│   │   └── api.ts      # API client
│   ├── store/          # Zustand state management
│   │   └── index.ts    # Global stores
│   └── styles/         # Global CSS
│       └── globals.css # Tailwind + custom styles
├── public/             # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🎨 Pages to Implement

### 1. Login Page (`/login`)
```tsx
// Simple page with "Login with Google" button
// Redirects to backend OAuth URL
```

### 2. Dashboard (`/dashboard`)
- KPI cards (impressions, clicks, conversions, cost)
- Chart: Cost & Conversions (last 30 days)
- Campaign list table
- Sync button

### 3. Campaigns (`/campaigns`)
- Campaign list with filters
- Status badges
- Metrics columns
- Click to view details

### 4. Campaign Details (`/campaigns/[id]`)
- Campaign info
- Metrics chart (30 days)
- Performance breakdown
- Generate recommendations button

### 5. Recommendations (`/recommendations`)
- Recommendation cards
- Filter by type/status
- Approve/Reject buttons
- AI confidence score
- Expected impact

### 6. Apply History (`/apply-history`)
- Applied recommendations list
- Success/failure status
- Changes made
- Timestamp

### 7. Audit Log (`/audit`)
- All changes timeline
- User who made change
- Before/after values
- Action type filter

### 8. Settings (`/settings`)
- Customer selection
- User profile
- Notification preferences

## 🔌 API Integration

All API calls are in `src/lib/api.ts`:

```typescript
import { campaignsAPI } from '@/lib/api';

// Example usage
const campaigns = await campaignsAPI.list({ customerId });
const metrics = await campaignsAPI.getMetrics(campaignId, 30);
```

## 🎨 Components to Create

### KPI Card
```tsx
<KPICard
  title="Total Clicks"
  value="1,234"
  change="+12%"
  icon={<MousePointerClick />}
/>
```

### Campaign Card
```tsx
<CampaignCard
  campaign={campaign}
  onSelect={() => router.push(`/campaigns/${campaign.id}`)}
/>
```

### Recommendation Card
```tsx
<RecommendationCard
  recommendation={rec}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```

### Metrics Chart
```tsx
<MetricsChart
  data={dailyMetrics}
  metrics={['cost', 'conversions']}
/>
```

## 🎯 Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
# or production:
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
```

## 🚢 Deployment (Vercel/Coolify)

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Coolify
1. New Resource → **Node.js**
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Port: 3000
5. Environment: `NEXT_PUBLIC_API_URL`

### Docker (optional)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## 📦 Dependencies

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **Axios**: HTTP client
- **Recharts**: Charts
- **Lucide React**: Icons
- **React Hot Toast**: Notifications

## 🎨 Design System

### Colors
- Primary: Blue (`#3b82f6`)
- Success: Green
- Warning: Yellow
- Danger: Red
- Gray: Neutral

### Typography
- Font: System font stack
- Sizes: text-sm, text-base, text-lg, text-xl

### Spacing
- Padding: p-4, p-6, p-8
- Margin: m-4, m-6, m-8
- Gap: gap-4, gap-6

## 🔐 Authentication Flow

1. User visits `/login`
2. Clicks "Login with Google"
3. Frontend calls `authAPI.getOAuthUrl()`
4. Redirects to Google OAuth
5. Google redirects to backend `/auth/google/callback`
6. Backend redirects to frontend `/auth/callback?token=...`
7. Frontend saves token and redirects to `/dashboard`

## ✅ TODO List

- [ ] Create all pages
- [ ] Implement components
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add animations
- [ ] Add responsive design
- [ ] Add dark mode (optional)
- [ ] Add tests
- [ ] Optimize performance
- [ ] Add SEO meta tags

## 🐛 Common Issues

### API calls fail
- Check `NEXT_PUBLIC_API_URL` env variable
- Check CORS settings in backend
- Check network tab in browser devtools

### Build fails
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Check TypeScript errors: `npm run build`

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

**Development Time:** ~2-3 days for complete UI
**Stack:** Next.js + TypeScript + Tailwind
**State:** Zustand (simple & powerful)
