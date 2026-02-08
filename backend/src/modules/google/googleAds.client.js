const { GoogleAdsApi } = require('google-ads-api');
require('dotenv').config();

class GoogleAdsClient {
  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });
  }

  // Müşteri nesnesini oluştururken login_customer_id opsiyoneldir, 
  // varsa eklenmesi (Manager hesapları için) kritik önem taşır.
  getCustomer(customerId, refreshToken) {
    return this.client.Customer({
      customer_id: customerId.replace(/-/g, ''), // Tireleri temizler
      refresh_token: refreshToken,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined
    });
  }

  // HATALI OLAN KISIM DÜZELTİLDİ: Artık doğrudan Service üzerinden çağrılıyor.
  async listAccessibleCustomers(refreshToken) {
    try {
      const customerService = this.client.Service({
        refresh_token: refreshToken,
      });
      const response = await customerService.listAccessibleCustomers();
      return response.resource_names || [];
    } catch (error) {
      console.error("Google Ads listAccessibleCustomers Hatası:", error.message);
      return [];
    }
  }

  async getCustomerInfo(customerId, refreshToken) {
    try {
      const customer = this.getCustomer(customerId, refreshToken);
      const query = `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.manager
        FROM customer
        WHERE customer.id = ${customerId.replace(/-/g, '')}
      `;

      const [result] = await customer.query(query);
      return result?.customer || null;
    } catch (error) {
      console.error(`CustomerInfo Hatası (${customerId}):`, error.message);
      return null;
    }
  }

  async getCampaigns(customerId, refreshToken) {
    const customer = this.getCustomer(customerId, refreshToken);
    
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        campaign.bidding_strategy_type,
        campaign.start_date,
        campaign.end_date,
        campaign.labels
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `;

    const campaigns = await customer.query(query);
    
    return campaigns.map(c => ({
      campaign_id: c.campaign?.id?.toString(),
      name: c.campaign?.name,
      status: c.campaign?.status,
      channel_type: c.campaign?.advertising_channel_type,
      budget: (c.campaign_budget?.amount_micros || 0) / 1000000,
      bidding_strategy: c.campaign?.bidding_strategy_type,
      start_date: c.campaign?.start_date,
      end_date: c.campaign?.end_date,
      labels: c.campaign?.labels || []
    }));
  }

  async getCampaignMetrics(customerId, refreshToken, daysBack = 30) {
    const customer = this.getCustomer(customerId, refreshToken);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const formatDate = (date) => {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    const query = `
      SELECT
        campaign.id,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions_from_interactions_rate
      FROM campaign
      WHERE 
        campaign.status != 'REMOVED'
        AND segments.date >= '${formatDate(startDate)}'
        AND segments.date <= '${formatDate(endDate)}'
      ORDER BY segments.date DESC
    `;

    const results = await customer.query(query);
    
    return results.map(r => ({
      campaign_id: r.campaign?.id?.toString(),
      date: r.segments?.date,
      impressions: r.metrics?.impressions || 0,
      clicks: r.metrics?.clicks || 0,
      cost_micros: r.metrics?.cost_micros || 0,
      conversions: r.metrics?.conversions || 0,
      conversions_value: r.metrics?.conversions_value || 0,
      ctr: r.metrics?.ctr || 0,
      avg_cpc: (r.metrics?.average_cpc || 0) / 1000000,
      conversion_rate: r.metrics?.conversions_from_interactions_rate || 0
    }));
  }

  async updateCampaignStatus(customerId, refreshToken, campaignId, status) {
    const customer = this.getCustomer(customerId, refreshToken);
    const operation = {
      resource_name: `customers/${customerId}/campaigns/${campaignId}`,
      status
    };
    return await customer.campaigns.update(operation, {
      update_mask: ['status']
    });
  }

  async updateCampaignBudget(customerId, refreshToken, campaignId, budgetMicros) {
    const customer = this.getCustomer(customerId, refreshToken);
    const query = `
      SELECT campaign_budget.resource_name
      FROM campaign
      WHERE campaign.id = ${campaignId}
    `;

    const [result] = await customer.query(query);
    const budgetResourceName = result?.campaign_budget?.resource_name;

    if (!budgetResourceName) throw new Error('Campaign budget not found');

    const operation = {
      resource_name: budgetResourceName,
      amount_micros: budgetMicros
    };

    return await customer.campaignBudgets.update(operation, {
      update_mask: ['amount_micros']
    });
  }
}

module.exports = new GoogleAdsClient();