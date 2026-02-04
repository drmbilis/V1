const { Worker } = require('bullmq');
const redis = require('../config/redis'); // Yol düzeltildi
const { sequelize } = require('../config/database'); // Yol düzeltildi
const { GoogleCustomer, Campaign, CampaignMetricsDaily, GoogleAccount } = require('../models'); // Modeller buradan çekilmeli
const googleAdsClient = require('../modules/google/googleAds.client'); // Klasör yapına göre güncellendi

const syncWorker = new Worker('sync', async (job) => {
  const { type, tenantId, customerId } = job.data;

  console.log(`[Sync Worker] Processing ${type} for customer ${customerId}`);

  try {
    switch (type) {
      case 'sync_customers':
        return await syncCustomers(tenantId);
      
      case 'sync_campaigns':
        return await syncCampaigns(tenantId, customerId);
      
      case 'sync_metrics_daily':
        return await syncMetricsDaily(tenantId, customerId, job.data.dateRange);
      
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  } catch (error) {
    console.error(`[Sync Worker] Error in ${type}:`, error);
    
    // Hata durumunda müşteri durumunu pasife çek
    if (customerId) {
      await GoogleCustomer.update(
        { 
          status: 'inactive',
          metadata: { lastError: error.message, errorAt: new Date() }
        },
        { where: { tenantId, customerId } }
      );
    }
    
    throw error;
  }
}, {
  connection: redis, // redisConnection hatası düzeltildi, config/redis'ten gelen nesne kullanıldı
  concurrency: 5
});

// --- Yardımcı Fonksiyonlar ---

async function syncCustomers(tenantId) {
  const googleAccount = await GoogleAccount.findOne({
    where: { tenantId, status: 'active' }
  });

  if (!googleAccount) {
    throw new Error('No active Google account found');
  }

  const refreshToken = googleAccount.getRefreshToken();
  const customerResources = await googleAdsClient.listAccessibleCustomers(refreshToken);
  
  const synced = [];
  for (const resource of customerResources) {
    const customerId = resource.replace('customers/', '');
    const customerInfo = await googleAdsClient.getCustomerInfo(customerId, refreshToken);
    
    const [customer, created] = await GoogleCustomer.findOrCreate({
      where: { tenantId, customerId },
      defaults: {
        descriptiveName: customerInfo.descriptive_name,
        currency: customerInfo.currency_code,
        timezone: customerInfo.time_zone,
        status: 'active',
        metadata: { manager: customerInfo.manager }
      }
    });

    if (!created) {
      customer.descriptiveName = customerInfo.descriptive_name;
      customer.status = 'active';
      await customer.save();
    }
    synced.push(customerId);
  }
  return { synced: synced.length, customers: synced };
}

async function syncCampaigns(tenantId, customerId) {
  const googleAccount = await GoogleAccount.findOne({
    where: { tenantId, status: 'active' }
  });

  if (!googleAccount) throw new Error('No active Google account found');

  const refreshToken = googleAccount.getRefreshToken();
  const campaigns = await googleAdsClient.getCampaigns(customerId, refreshToken);
  
  const synced = [];
  for (const gCampaign of campaigns) {
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
        metadata: { labels: gCampaign.labels || [], settings: gCampaign.settings || {} }
      }
    });

    if (!created) {
      campaign.name = gCampaign.name;
      campaign.status = gCampaign.status;
      campaign.budget = gCampaign.budget;
      await campaign.save();
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
  const googleAccount = await GoogleAccount.findOne({
    where: { tenantId, status: 'active' }
  });

  if (!googleAccount) throw new Error('No active Google account found');

  const refreshToken = googleAccount.getRefreshToken();
  const metricsData = await googleAdsClient.getCampaignMetrics(customerId, refreshToken, dateRange);
  
  const synced = [];
  for (const metric of metricsData) {
    const formattedDate = metric.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    
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
        conversionRate: metric.conversion_rate
      }
    });

    if (!created) {
      record.impressions = metric.impressions;
      record.clicks = metric.clicks;
      record.costMicros = metric.cost_micros;
      record.conversions = metric.conversions;
      record.conversionsValue = metric.conversions_value;
      record.ctr = metric.ctr;
      record.avgCpc = metric.avg_cpc;
      record.conversionRate = metric.conversion_rate;
      await record.save();
    }
    synced.push({ campaignId: metric.campaign_id, date: formattedDate });
  }

  await GoogleCustomer.update(
    { metadata: { lastMetricsSync: new Date() } },
    { where: { tenantId, customerId } }
  );

  return { synced: synced.length, metrics: synced };
}

// Olay Dinleyicileri
syncWorker.on('completed', (job) => {
  console.log(`[Sync Worker] Job ${job.id} completed:`, job.returnvalue);
});

syncWorker.on('failed', (job, err) => {
  console.error(`[Sync Worker] Job ${job?.id} failed:`, err);
});

module.exports = syncWorker;