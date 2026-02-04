const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { Campaign, CampaignMetricsDaily, GoogleCustomer } = require('../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');

router.use(authenticate);

// @route   GET /api/v1/campaigns
// @desc    List campaigns with latest metrics
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { customerId, status, channelType, limit = 50, offset = 0 } = req.query;

    const where = { tenantId: req.tenant.id };

    if (customerId) {
      // Verify customer belongs to tenant
      const customer = await GoogleCustomer.findOne({
        where: { tenantId: req.tenant.id, customerId }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (channelType) {
      where.channelType = channelType;
    }

    const campaigns = await Campaign.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Get latest metrics for each campaign
    const campaignIds = campaigns.map(c => c.campaignId);
    
    if (campaignIds.length > 0) {
      const latestMetrics = await CampaignMetricsDaily.findAll({
        attributes: [
          'campaign_id',
          [sequelize.fn('MAX', sequelize.col('date')), 'latest_date']
        ],
        where: {
          tenantId: req.tenant.id,
          campaignId: campaignIds
        },
        group: ['campaign_id']
      });

      const metricsMap = {};
      for (const metric of latestMetrics) {
        const fullMetric = await CampaignMetricsDaily.findOne({
          where: {
            tenantId: req.tenant.id,
            campaignId: metric.campaign_id,
            date: metric.dataValues.latest_date
          }
        });
        
        if (fullMetric) {
          metricsMap[metric.campaign_id] = fullMetric;
        }
      }

      // Attach metrics to campaigns
      campaigns.forEach(campaign => {
        campaign.dataValues.latestMetrics = metricsMap[campaign.campaignId] || null;
      });
    }

    res.json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/campaigns/:id
// @desc    Get single campaign with details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/campaigns/:id/metrics
// @desc    Get campaign metrics with date range
// @access  Private
router.get('/:id/metrics', async (req, res) => {
  try {
    const { range = 30 } = req.query;

    const campaign = await Campaign.findOne({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range));

    const metrics = await CampaignMetricsDaily.findAll({
      where: {
        tenantId: req.tenant.id,
        campaignId: campaign.campaignId,
        date: {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        }
      },
      order: [['date', 'ASC']]
    });

    // Calculate summary
    const summary = metrics.reduce((acc, m) => {
      acc.totalImpressions += parseInt(m.impressions) || 0;
      acc.totalClicks += parseInt(m.clicks) || 0;
      acc.totalCost += parseFloat(m.costMicros) / 1000000 || 0;
      acc.totalConversions += parseFloat(m.conversions) || 0;
      acc.totalConversionsValue += parseFloat(m.conversionsValue) || 0;
      return acc;
    }, {
      totalImpressions: 0,
      totalClicks: 0,
      totalCost: 0,
      totalConversions: 0,
      totalConversionsValue: 0
    });

    summary.avgCtr = summary.totalImpressions > 0 
      ? (summary.totalClicks / summary.totalImpressions) * 100 
      : 0;
    
    summary.avgCpc = summary.totalClicks > 0 
      ? summary.totalCost / summary.totalClicks 
      : 0;

    summary.conversionRate = summary.totalClicks > 0
      ? (summary.totalConversions / summary.totalClicks) * 100
      : 0;

    summary.roas = summary.totalCost > 0
      ? summary.totalConversionsValue / summary.totalCost
      : 0;

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status
        },
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days: parseInt(range)
        },
        summary,
        daily: metrics.map(m => ({
          date: m.date,
          impressions: parseInt(m.impressions) || 0,
          clicks: parseInt(m.clicks) || 0,
          cost: parseFloat(m.costMicros) / 1000000 || 0,
          conversions: parseFloat(m.conversions) || 0,
          conversionsValue: parseFloat(m.conversionsValue) || 0,
          ctr: parseFloat(m.ctr) || 0,
          avgCpc: parseFloat(m.avgCpc) || 0
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/campaigns/customer/:customerId
// @desc    Get all campaigns for a specific customer
// @access  Private
router.get('/customer/:customerId', async (req, res) => {
  try {
    // Verify customer belongs to tenant
    const customer = await GoogleCustomer.findOne({
      where: {
        tenantId: req.tenant.id,
        customerId: req.params.customerId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const campaigns = await Campaign.findAll({
      where: {
        tenantId: req.tenant.id,
        customerId: req.params.customerId
      },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
