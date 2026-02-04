const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApplyRun = sequelize.define('ApplyRun', {
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
  recommendationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'recommendations',
      key: 'id'
    }
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Prevents duplicate applies'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending'
  },
  dryRunResult: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Preview of what would change'
  },
  appliedChanges: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'What actually changed in Google Ads'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  appliedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'apply_runs',
  underscored: true,
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['recommendation_id']
    },
    {
      unique: true,
      fields: ['idempotency_key']
    }
  ]
});

module.exports = ApplyRun;
