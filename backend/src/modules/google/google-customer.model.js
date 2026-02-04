const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GoogleCustomer = sequelize.define('GoogleCustomer', {
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
    comment: 'Google Ads Customer ID (without dashes)'
  },
  descriptiveName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional customer metadata'
  }
}, {
  timestamps: true,
  tableName: 'google_customers',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'customer_id']
    }
  ]
});

module.exports = GoogleCustomer;
