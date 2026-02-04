const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const { Recommendation, Campaign, CampaignMetricsDaily, GoogleCustomer } = require('../../models');
const geminiService = require('../ai/gemini.service');
const deepseekService = require('../ai/deepseek.service');
const { Op } = require('sequelize');

router.use(authenticate);

// @route   POST /api/v1/recommendations/generate
// @desc    Generate AI recommendations for campaign
// @access  Private
router.post('/generate', async (req, res) => {
  try {
    const { campaignId, customerId, types, goal = 'conversions' } = req.body;

    if (!campaignId && !customerId) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID or Customer ID is required'
      });
    }

    // Get campaign
    const campaign = await Campaign.findOne({
      where: {
        ...(campaignId ? { id: campaignId } : {}),
        ...(customerId ? { customerId } : {}),
        tenantId: req.tenant.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Get last 30 days metrics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const metrics = await CampaignMetricsDaily.findAll({
      where: {
        tenantId: req.tenant.id,
        campaignId: campaign.campaignId,
        date: {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        }
      },
      order: [['date', 'DESC']]
    });

    // Calculate summary metrics
    const summary = metrics.reduce((acc, m) => {
      acc.clicks += parseInt(m.clicks) || 0;
      acc.conversions += parseFloat(m.conversions) || 0;
      acc.cost += parseFloat(m.costMicros) / 1000000 || 0;
      return acc;
    }, { clicks: 0, conversions: 0, cost: 0 });

    const recommendationTypes = types || ['keyword', 'adcopy', 'budget', 'pause'];
    const recommendations = [];

    // Generate recommendations based on types
    for (const type of recommendationTypes) {
      try {
        let aiResult;
        let proposalJson;
        let rationale;
        let confidence;
        let expectedImpact;
        let riskLevel;

        switch (type) {
          case 'keyword':
            aiResult = await geminiService.generateKeywordRecommendations(campaign);
            if (!aiResult.error) {
              proposalJson = {
                keywords: aiResult.keywords || [],
                negativeKeywords: aiResult.negativeKeywords || []
              };
              rationale = aiResult.rationale;
              confidence = aiResult.confidence || 0.7;
              expectedImpact = aiResult.expectedImpact || {};
              riskLevel = 'low';
            }
            break;

          case 'adcopy':
            aiResult = await geminiService.generateAdCopyRecommendations(campaign);
            if (!aiResult.error) {
              proposalJson = {
                headlines: aiResult.headlines || [],
                descriptions: aiResult.descriptions || []
              };
              rationale = aiResult.rationale;
              confidence = aiResult.confidence || 0.75;
              expectedImpact = aiResult.expectedImpact || {};
              riskLevel = 'low';
            }
            break;

          case 'budget':
            aiResult = await geminiService.generateBudgetRecommendation(campaign, summary);
            if (!aiResult.error) {
              proposalJson = {
                currentBudget: aiResult.currentBudget,
                recommendedBudget: aiResult.recommendedBudget,
                changePercent: aiResult.changePercent
              };
              rationale = aiResult.rationale;
              confidence = aiResult.confidence || 0.8;
              expectedImpact = aiResult.expectedImpact || {};
              riskLevel = aiResult.riskLevel || 'medium';
            }
            break;

          case 'pause':
            aiResult = await geminiService.generatePauseRecommendation(campaign, summary);
            if (!aiResult.error && aiResult.shouldPause) {
              proposalJson = {
                action: 'pause',
                reason: aiResult.rationale,
                alternatives: aiResult.alternativeActions || []
              };
              rationale = aiResult.rationale;
              confidence = aiResult.confidence || 0.75;
              expectedImpact = { costSavings: `$${summary.cost.toFixed(2)}` };
              riskLevel = aiResult.riskLevel || 'low';
            }
            break;
        }

        if (proposalJson) {
          const recommendation = await Recommendation.create({
            tenantId: req.tenant.id,
            customerId: campaign.customerId,
            scopeType: 'campaign',
            scopeId: campaign.campaignId,
            source: 'ai',
            type,
            proposalJson,
            rationale,
            confidence,
            expectedImpactJson: expectedImpact,
            riskLevel,
            status: 'draft'
          });

          recommendations.push(recommendation);
        }
      } catch (error) {
        console.error(`Error generating ${type} recommendation:`, error);
      }
    }

    res.json({
      success: true,
      message: `Generated ${recommendations.length} recommendation(s)`,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/recommendations
// @desc    List recommendations
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { customerId, status, type, limit = 50, offset = 0 } = req.query;

    const where = { tenantId: req.tenant.id };

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const recommendations = await Recommendation.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/recommendations/:id
// @desc    Get single recommendation
// @access  Private
router.get('/:id', async (req, res) => {
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

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/recommendations/:id/approve
// @desc    Approve recommendation
// @access  Private (admin/member)
router.post('/:id/approve', requireRole('admin', 'member'), async (req, res) => {
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

    if (recommendation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Only draft recommendations can be approved'
      });
    }

    recommendation.status = 'approved';
    await recommendation.save();

    res.json({
      success: true,
      message: 'Recommendation approved',
      data: recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/recommendations/:id/reject
// @desc    Reject recommendation
// @access  Private
router.post('/:id/reject', async (req, res) => {
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

    recommendation.status = 'rejected';
    await recommendation.save();

    res.json({
      success: true,
      message: 'Recommendation rejected',
      data: recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/v1/recommendations/analyze
// @desc    Deep analysis with DeepSeek
// @access  Private
router.post('/analyze', async (req, res) => {
  try {
    const { campaignId } = req.body;

    const campaign = await Campaign.findOne({
      where: {
        id: campaignId,
        tenantId: req.tenant.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Get metrics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

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

    // Analyze with DeepSeek
    const analysis = await deepseekService.analyzePerformanceTrend(campaign, metrics);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
