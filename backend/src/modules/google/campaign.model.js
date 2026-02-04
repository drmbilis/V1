const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database')

const Campaign = sequelize.define('Campaign', {
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
    allowNull: false,
    comment: 'Google Ads Customer ID'
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Google Ads Campaign ID'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ENABLED, PAUSED, REMOVED'
  },
  channelType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'SEARCH, DISPLAY, SHOPPING, VIDEO'
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  biddingStrategy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional campaign data'
  }
}, {
  timestamps: true,
  tableName: 'campaigns',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'customer_id', 'campaign_id']
    }
  ]
});

module.exports = Campaign;
