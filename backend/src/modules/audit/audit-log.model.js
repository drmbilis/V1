const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database')

const AuditLog = sequelize.define('AuditLog', {
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
  actorUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who performed the action (null for system)'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'campaign.pause, campaign.budget_update, etc'
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'campaign, ad_group, keyword, etc'
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID of the affected entity'
  },
  beforeJson: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'State before change'
  },
  afterJson: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'State after change'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional context (IP, user agent, etc)'
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'audit_logs',
  underscored: true,
  indexes: [
    {
      fields: ['tenant_id', 'created_at']
    },
    {
      fields: ['actor_user_id']
    },
    {
      fields: ['target_type', 'target_id']
    }
  ]
});

module.exports = AuditLog;
