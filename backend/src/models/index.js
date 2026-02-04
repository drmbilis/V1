const { sequelize } = require('../config/database');
// Import models
const Tenant = require('../modules/tenants/tenant.model');
const User = require('../modules/auth/user.model');
const TenantUser = require('../modules/tenants/tenant-user.model');
const GoogleAccount = require('../modules/google/google-account.model');
const GoogleCustomer = require('../modules/google/google-customer.model');
const Campaign = require('../modules/google/campaign.model');
const CampaignMetricsDaily = require('../modules/google/campaign-metrics-daily.model');
const Recommendation = require('../modules/recommendations/recommendation.model');
const AuditLog = require('../modules/audit/audit-log.model');
const ApplyRun = require('../modules/apply/apply-run.model');
const db = require('../../config/database')

// Define relationships

// Tenant relationships
Tenant.hasMany(TenantUser, { foreignKey: 'tenantId', as: 'tenantUsers' });
Tenant.hasMany(GoogleAccount, { foreignKey: 'tenantId', as: 'googleAccounts' });
Tenant.hasMany(GoogleCustomer, { foreignKey: 'tenantId', as: 'googleCustomers' });
Tenant.hasMany(Campaign, { foreignKey: 'tenantId', as: 'campaigns' });
Tenant.hasMany(Recommendation, { foreignKey: 'tenantId', as: 'recommendations' });
Tenant.hasMany(AuditLog, { foreignKey: 'tenantId', as: 'auditLogs' });

// User relationships
User.hasMany(TenantUser, { foreignKey: 'userId', as: 'tenantMemberships' });
User.hasMany(AuditLog, { foreignKey: 'actorUserId', as: 'auditActions' });

// TenantUser relationships
TenantUser.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
TenantUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// GoogleAccount relationships
GoogleAccount.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// GoogleCustomer relationships
GoogleCustomer.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Campaign relationships
Campaign.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Campaign.hasMany(CampaignMetricsDaily, { foreignKey: 'campaignId', sourceKey: 'campaignId', as: 'metrics' });

// CampaignMetricsDaily relationships
CampaignMetricsDaily.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Recommendation relationships
Recommendation.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Recommendation.belongsTo(User, { foreignKey: 'appliedBy', as: 'applier' });
Recommendation.hasMany(ApplyRun, { foreignKey: 'recommendationId', as: 'applyRuns' });

// AuditLog relationships
AuditLog.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
AuditLog.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });

// ApplyRun relationships
ApplyRun.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
ApplyRun.belongsTo(Recommendation, { foreignKey: 'recommendationId', as: 'recommendation' });
ApplyRun.belongsTo(User, { foreignKey: 'appliedBy', as: 'applier' });

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force && process.env.NODE_ENV === 'development' });
    console.log('✅ Database synchronized');
    return true;
  } catch (error) {
    console.error('❌ Database sync error:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  Tenant,
  User,
  TenantUser,
  GoogleAccount,
  GoogleCustomer,
  Campaign,
  CampaignMetricsDaily,
  Recommendation,
  AuditLog,
  ApplyRun,
  syncDatabase
};
