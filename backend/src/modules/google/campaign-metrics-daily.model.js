const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database')
const CampaignMetricsDaily = sequelize.define('CampaignMetricsDaily', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  impressions: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  costMicros: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Cost in micros (divide by 1M for actual cost)'
  },
  conversions: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  conversionsValue: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  ctr: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: 'Click-through rate'
  },
  avgCpc: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Average cost per click'
  },
  conversionRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'campaign_metrics_daily',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'customer_id', 'campaign_id', 'date']
    },
    {
      fields: ['date']
    },
    {
      fields: ['campaign_id', 'date']
    }
  ]
});

module.exports = CampaignMetricsDaily;
