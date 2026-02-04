const { ApplyRun, Recommendation, AuditLog, Campaign } = require('../../models');
const googleAdsClient = require('../google/googleAds.client');
const { v4: uuidv4 } = require('uuid');

class ApplyService {
  constructor() {
    this.MAX_BUDGET_CHANGE_PERCENT = parseFloat(process.env.MAX_BUDGET_CHANGE_PERCENT) || 30;
    this.MIN_DAILY_BUDGET = parseFloat(process.env.MIN_DAILY_BUDGET) || 5;
  }

  async validateBudgetChange(currentBudget, newBudget) {
    const currentBudgetNum = parseFloat(currentBudget);
    const newBudgetNum = parseFloat(newBudget);

    if (newBudgetNum < this.MIN_DAILY_BUDGET) {
      throw new Error(`Budget cannot be less than $${this.MIN_DAILY_BUDGET}`);
    }

    const changePercent = Math.abs(((newBudgetNum - currentBudgetNum) / currentBudgetNum) * 100);

    if (changePercent > this.MAX_BUDGET_CHANGE_PERCENT) {
      throw new Error(`Budget change cannot exceed ${this.MAX_BUDGET_CHANGE_PERCENT}%. Current change: ${changePercent.toFixed(1)}%`);
    }

    return true;
  }

  async dryRun(recommendation, googleAccount) {
    const { type, proposalJson, scopeId: campaignId, customerId } = recommendation;

    const dryRunResult = {
      type,
      campaignId,
      changes: [],
      warnings: [],
      validationPassed: true
    };

    try {
      switch (type) {
        case 'budget':
          const campaign = await Campaign.findOne({
            where: { campaignId, customerId }
          });

          if (!campaign) {
            throw new Error('Campaign not found');
          }

          const currentBudget = parseFloat(campaign.budget);
          const newBudget = parseFloat(proposalJson.recommendedBudget);

          // Validate budget change
          await this.validateBudgetChange(currentBudget, newBudget);

          dryRunResult.changes.push({
            field: 'daily_budget',
            from: currentBudget,
            to: newBudget,
            change: `${((newBudget - currentBudget) / currentBudget * 100).toFixed(1)}%`
          });

          if (newBudget > currentBudget * 1.2) {
            dryRunResult.warnings.push('Budget increase exceeds 20% - monitor performance closely');
          }
          break;

        case 'pause':
          dryRunResult.changes.push({
            field: 'status',
            from: 'ENABLED',
            to: 'PAUSED',
            note: 'Campaign will stop serving ads immediately'
          });
          break;

        case 'resume':
          dryRunResult.changes.push({
            field: 'status',
            from: 'PAUSED',
            to: 'ENABLED',
            note: 'Campaign will start serving ads'
          });
          break;

        default:
          throw new Error(`Apply not supported for type: ${type}`);
      }
    } catch (error) {
      dryRunResult.validationPassed = false;
      dryRunResult.error = error.message;
    }

    return dryRunResult;
  }

  async apply(recommendation, googleAccount, userId, idempotencyKey) {
    const { type, proposalJson, scopeId: campaignId, customerId, tenantId } = recommendation;

    // Check for existing apply run with same idempotency key
    const existingRun = await ApplyRun.findOne({
      where: { idempotencyKey }
    });

    if (existingRun) {
      return {
        success: true,
        message: 'Already applied (idempotency)',
        applyRun: existingRun
      };
    }

    // Create apply run record
    const applyRun = await ApplyRun.create({
      tenantId,
      recommendationId: recommendation.id,
      idempotencyKey,
      status: 'pending',
      appliedBy: userId
    });

    try {
      const refreshToken = googleAccount.getRefreshToken();
      let beforeState = {};
      let afterState = {};
      let changes = {};

      const campaign = await Campaign.findOne({
        where: { campaignId, customerId, tenantId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      switch (type) {
        case 'budget':
          const currentBudget = parseFloat(campaign.budget);
          const newBudget = parseFloat(proposalJson.recommendedBudget);

          // Validate
          await this.validateBudgetChange(currentBudget, newBudget);

          beforeState = { budget: currentBudget };
          
          // Update in Google Ads
          const budgetMicros = Math.round(newBudget * 1000000);
          await googleAdsClient.updateCampaignBudget(
            customerId,
            refreshToken,
            campaignId,
            budgetMicros
          );

          // Update local DB
          campaign.budget = newBudget;
          await campaign.save();

          afterState = { budget: newBudget };
          changes = {
            field: 'budget',
            from: currentBudget,
            to: newBudget
          };
          break;

        case 'pause':
          beforeState = { status: campaign.status };

          // Update in Google Ads
          await googleAdsClient.updateCampaignStatus(
            customerId,
            refreshToken,
            campaignId,
            'PAUSED'
          );

          // Update local DB
          campaign.status = 'PAUSED';
          await campaign.save();

          afterState = { status: 'PAUSED' };
          changes = {
            field: 'status',
            from: beforeState.status,
            to: 'PAUSED'
          };
          break;

        case 'resume':
          beforeState = { status: campaign.status };

          // Update in Google Ads
          await googleAdsClient.updateCampaignStatus(
            customerId,
            refreshToken,
            campaignId,
            'ENABLED'
          );

          // Update local DB
          campaign.status = 'ENABLED';
          await campaign.save();

          afterState = { status: 'ENABLED' };
          changes = {
            field: 'status',
            from: beforeState.status,
            to: 'ENABLED'
          };
          break;

        default:
          throw new Error(`Apply not supported for type: ${type}`);
      }

      // Update apply run
      applyRun.status = 'success';
      applyRun.appliedChanges = changes;
      await applyRun.save();

      // Update recommendation
      recommendation.status = 'applied';
      recommendation.appliedAt = new Date();
      recommendation.appliedBy = userId;
      await recommendation.save();

      // Create audit log
      await AuditLog.create({
        tenantId,
        actorUserId: userId,
        action: `campaign.${type}`,
        targetType: 'campaign',
        targetId: campaignId,
        beforeJson: beforeState,
        afterJson: afterState,
        metadata: {
          recommendationId: recommendation.id,
          applyRunId: applyRun.id
        },
        success: true
      });

      return {
        success: true,
        message: 'Applied successfully',
        applyRun,
        changes
      };
    } catch (error) {
      // Update apply run with error
      applyRun.status = 'failed';
      applyRun.error = error.message;
      await applyRun.save();

      // Create audit log for failure
      await AuditLog.create({
        tenantId,
        actorUserId: userId,
        action: `campaign.${type}`,
        targetType: 'campaign',
        targetId: campaignId,
        metadata: {
          recommendationId: recommendation.id,
          applyRunId: applyRun.id,
          error: error.message
        },
        success: false,
        errorMessage: error.message
      });

      throw error;
    }
  }
}

module.exports = new ApplyService();
