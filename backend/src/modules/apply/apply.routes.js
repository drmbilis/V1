const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const { Recommendation, GoogleAccount, ApplyRun, AuditLog } = require('../../models');
const applyService = require('./apply.service');
const { v4: uuidv4 } = require('uuid');

router.use(authenticate);

// @route   POST /api/v1/apply/recommendations/:id/dry-run
// @desc    Preview what would change (dry run)
// @access  Private (admin/member)
router.post('/recommendations/:id/dry-run', requireRole('admin', 'member'), async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id
      }
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }

    if (recommendation.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved recommendations can be applied'
      });
    }

    // Get Google account
    const googleAccount = await GoogleAccount.findOne({
      where: {
        tenantId: req.tenant.id,
        status: 'active'
      }
    });

    if (!googleAccount) {
      return res.status(400).json({
        success: false,
        error: 'No active Google account found'
      });
    }

    // Run dry-run
    const dryRunResult = await applyService.dryRun(recommendation, googleAccount);

    res.json({
      success: true,
      data: dryRunResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/apply/recommendations/:id
// @desc    Apply recommendation to Google Ads
// @access  Private (admin only)
router.post('/recommendations/:id', requireRole('admin'), async (req, res) => {
  try {
    const { confirmDryRun } = req.body;
    
    // Get idempotency key from header or generate
    const idempotencyKey = req.headers['idempotency-key'] || uuidv4();

    const recommendation = await Recommendation.findOne({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id
      }
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found'
      });
    }

    if (recommendation.status === 'applied') {
      return res.status(400).json({
        success: false,
        error: 'Recommendation already applied'
      });
    }

    if (recommendation.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved recommendations can be applied'
      });
    }

    // Get Google account
    const googleAccount = await GoogleAccount.findOne({
      where: {
        tenantId: req.tenant.id,
        status: 'active'
      }
    });

    if (!googleAccount) {
      return res.status(400).json({
        success: false,
        error: 'No active Google account found'
      });
    }

    // If confirmDryRun not provided, return dry-run first
    if (!confirmDryRun) {
      const dryRunResult = await applyService.dryRun(recommendation, googleAccount);
      
      return res.json({
        success: false,
        requiresConfirmation: true,
        message: 'Please review dry-run results and confirm',
        dryRun: dryRunResult,
        confirmationRequired: {
          field: 'confirmDryRun',
          value: true,
          idempotencyKey
        }
      });
    }

    // Apply the recommendation
    const result = await applyService.apply(
      recommendation,
      googleAccount,
      req.user.id,
      idempotencyKey
    );

    res.json({
      success: true,
      message: 'Recommendation applied successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/apply/runs
// @desc    Get apply run history
// @access  Private
router.get('/runs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const runs = await ApplyRun.findAll({
      where: { tenantId: req.tenant.id },
      include: [{
        model: Recommendation,
        as: 'recommendation',
        attributes: ['id', 'type', 'scopeType', 'scopeId']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: runs.length,
      data: runs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/apply/runs/:id
// @desc    Get single apply run details
// @access  Private
router.get('/runs/:id', async (req, res) => {
  try {
    const run = await ApplyRun.findOne({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id
      },
      include: [{
        model: Recommendation,
        as: 'recommendation'
      }]
    });

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Apply run not found'
      });
    }

    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/apply/audit
// @desc    Get audit log
// @access  Private
router.get('/audit', async (req, res) => {
  try {
    const { limit = 100, offset = 0, action, targetType } = req.query;

    const where = { tenantId: req.tenant.id };

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    const logs = await AuditLog.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
