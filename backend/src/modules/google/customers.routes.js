const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { GoogleCustomer, GoogleAccount, Tenant } = require('../../models');
const { syncQueue } = require('../jobs/queues');

router.use(authenticate);

// @route   GET /api/v1/customers
// @desc    List all Google Ads customers for tenant
// @access  Private
router.get('/', async (req, res) => {
  try {
    const customers = await GoogleCustomer.findAll({
      where: { tenantId: req.tenant.id },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/customers/:id
// @desc    Get single customer details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const customer = await GoogleCustomer.findOne({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/customers/select
// @desc    Select active customer for tenant
// @access  Private
router.post('/select', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    // Verify customer exists and belongs to tenant
    const customer = await GoogleCustomer.findOne({
      where: {
        customerId,
        tenantId: req.tenant.id
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Update tenant's selected customer
    await Tenant.update(
      { selectedCustomerId: customerId },
      { where: { id: req.tenant.id } }
    );

    res.json({
      success: true,
      message: 'Customer selected successfully',
      data: { customerId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/customers/refresh
// @desc    Refresh customer list from Google Ads
// @access  Private
router.post('/refresh', async (req, res) => {
  try {
    // Check if Google account exists
    const googleAccount = await GoogleAccount.findOne({
      where: {
        tenantId: req.tenant.id,
        status: 'active'
      }
    });

    if (!googleAccount) {
      return res.status(400).json({
        success: false,
        error: 'No active Google account. Please connect your Google account first.'
      });
    }

    // Queue sync customers job
    const job = await syncQueue.add('sync_customers', {
      type: 'sync_customers',
      tenantId: req.tenant.id
    });

    res.json({
      success: true,
      message: 'Customer refresh queued',
      data: {
        jobId: job.id,
        status: 'queued'
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
