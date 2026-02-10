const { Worker } = require('bullmq');
const redis = require('../config/redis');
const { sequelize } = require('../config/database');
const { GoogleCustomer, Campaign, CampaignMetricsDaily, GoogleAccount } = require('../models');
const googleAdsClient = require('../modules/google/googleAds.client');

function pickGoogleAdsError(err) {
  // Google Ads / gRPC / axios hataları farklı yerlerde saklıyor olabilir
  return (
    err?.response?.data ||
    err?.errors ||
    err?.details ||
    err?.failure ||
    err?.message ||
    err
  );
}

const syncWorker = new Worker(
  'sync',
  async (job) => {
    const { type, tenantId, userId, customerId } = job.data;
    const activeTenantId = tenantId || userId;

    console.log(
      `[Sync Worker] 🚀 İşlem Başladı: ${type} | Tenant: ${activeTenantId} | Customer: ${customerId || 'N/A'}`
    );

    if (!activeTenantId) {
      console.error('[Sync Worker] ❌ KRİTİK HATA: tenantId veya userId yok!');
      return;
    }

    try {
      switch (type) {
        case 'sync_customers':
          return await syncCustomers(activeTenantId);

        case 'sync_campaigns':
          return await syncCampaigns(activeTenantId, customerId);

        case 'sync_metrics_daily':
          return await syncMetricsDaily(activeTenantId, customerId, job.data.dateRange);

        default:
          throw new Error(`Bilinmeyen senkronizasyon tipi: ${type}`);
      }
    } catch (error) {
      const realError = pickGoogleAdsError(error);
      console.error(`[Sync Worker] ❌ ${type} Hatası:`, realError);

      if (customerId) {
        try {
          await GoogleCustomer.update(
            {
              status: 'inactive',
              metadata: { lastError: String(error?.message || realError), errorAt: new Date() },
            },
            { where: { tenantId: activeTenantId, customerId } }
          );
        } catch (dbErr) {
          console.error('[Sync Worker] Müşteri durumu güncellenemedi:', pickGoogleAdsError(dbErr));
        }
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

// --- Yardımcı Fonksiyonlar ---

async function syncCustomers(tenantId) {
  const googleAccount = await GoogleAccount.findOne({
    where: { tenantId, status: 'active' },
  });

  if (!googleAccount) {
    throw new Error(`Tenant için aktif Google hesabı bulunamadı: ${tenantId}`);
  }

  const refreshToken = googleAccount.getRefreshToken();

  const response = await googleAdsClient.listAccessibleCustomers(refreshToken);

  // Google bazen direkt dizi, bazen {resource_names: []}
  const customerResources = Array.isArray(response) ? response : response?.resource_names || [];

  if (customerResources.length === 0) {
    console.warn(`[Sync Worker] ⚠️ Erişilebilir müşteri bulunamadı: ${tenantId}`);
    return { synced: 0, failed: 0, customers: [] };
  }

  const synced = [];
  let successCount = 0;
  let failCount = 0;

  for (const resource of customerResources) {
    try {
      const customerId = resource.includes('/') ? resource.split('/')[1] : resource;

      const customerInfo = await googleAdsClient.getCustomerInfo(customerId, refreshToken);
      if (!customerInfo) {
        failCount++;
        continue;
      }

      const [customer, created] = await GoogleCustomer.findOrCreate({
        where: { tenantId, customerId },
        defaults: {
          descriptiveName: customerInfo.descriptive_name || 'Ads Account',
          currency: customerInfo.currency_code,
          timezone: customerInfo.time_zone,
          status: 'active',
          metadata: { manager: !!customerInfo.manager },
        },
      });

      if (!created) {
        await customer.update({
          descriptiveName: customerInfo.descriptive_name,
          status: 'active',
          metadata: { ...(customer.metadata || {}), manager: !!customerInfo.manager },
        });
      }

      synced.push(customerId);
      successCount++;
    } catch (err) {
      failCount++;
      console.error(
        `[Sync Worker] CustomerInfo Hatası (${resource}):`,
        pickGoogleAdsError(err)
      );
      // istersen debug:
      // console.error('[Sync Worker] RAW ERROR:', err);
    }
  }

  // Eğer hepsi fail olduysa job'u fail ettirmek daha doğru:
  if (successCount === 0 && failCount > 0) {
    throw new Error(`sync_customers: all failed (${failCount}/${customerResources.length})`);
  }

  return { synced: successCount, failed: failCount, customers: synced };
}

async function syncCampaigns(tenantId, customerId) {
  const googleAccount = await GoogleAccount.findOne({ where: { tenantId, status: 'active' } });
  if (!googleAccount) throw new Error('Aktif Google hesabı bulunamadı');

  const refreshToken = googleAccount.getRefreshToken();
  const campaigns = await googleAdsClient.getCampaigns(customerId, refreshToken);

  const campaignList = Array.isArray(campaigns) ? campaigns : [];

  const synced = [];
  for (const gCampaign of campaignList) {
    const [campaign, created] = await Campaign.findOrCreate({
      where: { tenantId, customerId, campaignId: gCampaign.campaign_id },
      defaults: {
        name: gCampaign.name,
        status: gCampaign.status,
        channelType: gCampaign.channel_type,
        budget: gCampaign.budget,
        biddingStrategy: gCampaign.bidding_strategy,
        startDate: gCampaign.start_date,
        endDate: gCampaign.end_date,
        metadata: { labels: gCampaign.labels || [], settings: gCampaign.settings || {} },
      },
    });

    if (!created) {
      await campaign.update({
        name: gCampaign.name,
        status: gCampaign.status,
        budget: gCampaign.budget,
      });
    }
    synced.push(campaign.campaignId);
  }

  await GoogleCustomer.update(
    { metadata: { lastCampaignSync: new Date() } },
    { where: { tenantId, customerId } }
  );

  return { synced: synced.length, campaigns: synced };
}

async function syncMetricsDaily(tenantId, customerId, dateRange = 30) {
  const googleAccount = await GoogleAccount.findOne({ where: { tenantId, status: 'active' } });
  if (!googleAccount) throw new Error('Aktif Google hesabı bulunamadı');

  const refreshToken = googleAccount.getRefreshToken();
  const metricsData = await googleAdsClient.getCampaignMetrics(customerId, refreshToken, dateRange);

  const metricsList = Array.isArray(metricsData) ? metricsData : [];

  const synced = [];
  for (const metric of metricsList) {
    const formattedDate = String(metric.date || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

    const [record, created] = await CampaignMetricsDaily.findOrCreate({
      where: { tenantId, customerId, campaignId: metric.campaign_id, date: formattedDate },
      defaults: {
        impressions: metric.impressions,
        clicks: metric.clicks,
        costMicros: metric.cost_micros,
        conversions: metric.conversions,
        conversionsValue: metric.conversions_value,
        ctr: metric.ctr,
        avgCpc: metric.avg_cpc,
        conversionRate: metric.conversion_rate,
      },
    });

    if (!created) {
      await record.update({
        impressions: metric.impressions,
        clicks: metric.clicks,
        costMicros: metric.cost_micros,
        conversions: metric.conversions,
        conversionsValue: metric.conversions_value,
        ctr: metric.ctr,
        avgCpc: metric.avg_cpc,
        conversionRate: metric.conversion_rate,
      });
    }
    synced.push({ campaignId: metric.campaign_id, date: formattedDate });
  }

  return { synced: synced.length, metrics: synced };
}

// Olay Dinleyicileri
syncWorker.on('completed', (job) => {
  console.log(`[Sync Worker] ✅ İş ${job.id} başarıyla tamamlandı.`);
});

syncWorker.on('failed', (job, err) => {
  console.error(`[Sync Worker] ❌ İş ${job?.id} başarısız:`, pickGoogleAdsError(err));
});

module.exports = syncWorker;
