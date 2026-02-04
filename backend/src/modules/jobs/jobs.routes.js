const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const { syncQueue } = require('../jobs/queues');
const { GoogleCustomer, GoogleAccount } = require('../../models');

router.use(authenticate);

// @route   POST /api/v1/jobs/sync
// @desc    Trigger sync job
// @access  Private (admin/member)
router.post('/sync', requireRole('admin', 'member'), async (req, res) => {
  try {
    const { customerId, type } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    // Verify customer belongs to tenant
    const customer = await GoogleCustomer.findOne({
      where: {
        tenantId: req.tenant.id,
        customerId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Determine sync type
    const syncTypes = type ? [type] : ['sync_campaigns', 'sync_metrics_daily'];
    const jobs = [];

    for (const syncType of syncTypes) {
      const job = await syncQueue.add(syncType, {
        type: syncType,
        tenantId: req.tenant.id,
        customerId,
        dateRange: 30
      });

      jobs.push({
        id: job.id,
        type: syncType,
        status: 'queued'
      });
    }

    res.json({
      success: true,
      message: `Queued ${jobs.length} sync job(s)`,
      data: { jobs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/jobs/sync/status
// @desc    Get sync status
// @access  Private
router.get('/sync/status', async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const customer = await GoogleCustomer.findOne({
      where: {
        tenantId: req.tenant.id,
        customerId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const googleAccount = await GoogleAccount.findOne({
      where: {
        tenantId: req.tenant.id,
        status: 'active'
      }
    });

    res.json({
      success: true,
      data: {
        customerId: customer.customerId,
        lastCampaignSync: customer.metadata?.lastCampaignSync || null,
        lastMetricsSync: customer.metadata?.lastMetricsSync || null,
        status: customer.status,
        accountStatus: googleAccount?.status || 'inactive',
        error: customer.metadata?.lastError || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/jobs/sync-all
// @desc    Sync all customers for tenant
// @access  Private (admin only)
router.post('/sync-all', requireRole('admin'), async (req, res) => {
  try {
    const customers = await GoogleCustomer.findAll({
      where: {
        tenantId: req.tenant.id,
        status: 'active'
      }
    });

    const jobs = [];

    for (const customer of customers) {
      // Queue campaigns sync
      const campaignJob = await syncQueue.add('sync_campaigns', {
        type: 'sync_campaigns',
        tenantId: req.tenant.id,
        customerId: customer.customerId
      });

      // Queue metrics sync
      const metricsJob = await syncQueue.add('sync_metrics_daily', {
        type: 'sync_metrics_daily',
        tenantId: req.tenant.id,
        customerId: customer.customerId,
        dateRange: 30
      });

      jobs.push(
        { id: campaignJob.id, customerId: customer.customerId, type: 'campaigns' },
        { id: metricsJob.id, customerId: customer.customerId, type: 'metrics' }
      );
    }

    res.json({
      success: true,
      message: `Queued ${jobs.length} jobs for ${customers.length} customer(s)`,
      data: { jobs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
