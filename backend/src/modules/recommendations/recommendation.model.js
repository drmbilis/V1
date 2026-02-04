const { DataTypes } = require('sequelize');
const { sequelize } =require('../../config/database')

const Recommendation = sequelize.define('Recommendation', {
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
  scopeType: {
    type: DataTypes.ENUM('campaign', 'ad_group', 'keyword', 'ad'),
    allowNull: false,
    comment: 'What entity this recommendation applies to'
  },
  scopeId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of the entity (campaign_id, ad_group_id, etc)'
  },
  source: {
    type: DataTypes.ENUM('google', 'ai'),
    defaultValue: 'ai',
    comment: 'google: from Google Ads API, ai: from our AI'
  },
  type: {
    type: DataTypes.ENUM('keyword', 'adcopy', 'budget', 'bid', 'negative_kw', 'pause', 'resume'),
    allowNull: false
  },
  proposalJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Structured proposal data (schema depends on type)'
  },
  rationale: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI explanation for this recommendation'
  },
  confidence: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.5,
    comment: 'AI confidence score (0-1)'
  },
  expectedImpactJson: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Expected changes: { clicks: +10%, cost: -5% }'
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('draft', 'approved', 'applied', 'rejected', 'failed'),
    defaultValue: 'draft'
  },
  appliedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  appliedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'recommendations',
  underscored: true,
  indexes: [
    {
      fields: ['tenant_id', 'customer_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = Recommendation;
