const express = require('express');
const router = express.Router();
const { syncQueue } = require('./queues');
const { GoogleCustomer } = require('../../models');
const { authenticate, requireRole } = require('../../middleware/auth');

/**
 * ✅ MANUAL SYNC ENDPOINT
 * For Dashboard "Sync Now" button
 */

// @route   POST /api/v1/jobs/sync-now
// @desc    Trigger manual sync for selected customer
// @access  Private (admin/member)
router.post('/sync-now', authenticate, requireRole('admin', 'member'), async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID required'
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

    console.log(\`🔄 Manual sync triggered for customer \${customerId}\`);

    // Queue campaigns sync
    const campaignJob = await syncQueue.add('sync_campaigns', {
      type: 'sync_campaigns',
      tenantId: req.tenant.id,
      customerId
    }, {
      priority: 1, // High priority for manual sync
      attempts: 3,
    });

    // Queue metrics sync
    const metricsJob = await syncQueue.add('sync_metrics_daily', {
      type: 'sync_metrics_daily',
      tenantId: req.tenant.id,
      customerId,
      dateRange: 30
    }, {
      priority: 1,
      attempts: 3,
    });

    res.json({
      success: true,
      message: 'Sync started. This may take 30-60 seconds.',
      jobs: [
        { id: campaignJob.id, type: 'campaigns', status: 'queued' },
        { id: metricsJob.id, type: 'metrics', status: 'queued' }
      ]
    });

  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/jobs/sync-customers
// @desc    Refresh customer list from Google Ads
// @access  Private (admin/member)
router.post('/sync-customers', authenticate, requireRole('admin', 'member'), async (req, res) => {
  try {
    console.log(\`🔄 Customer refresh triggered for tenant \${req.tenant.id}\`);

    const job = await syncQueue.add('sync_customers', {
      type: 'sync_customers',
      tenantId: req.tenant.id
    }, {
      priority: 1,
      attempts: 3,
    });

    res.json({
      success: true,
      message: 'Customer refresh started',
      jobId: job.id
    });

  } catch (error) {
    console.error('Customer sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/jobs/status/:jobId
// @desc    Get job status
// @access  Private
router.get('/status/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await syncQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      success: true,
      data: {
        id: job.id,
        type: job.data.type,
        state: state,
        progress: progress,
        result: job.returnvalue,
        failedReason: job.failedReason,
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
