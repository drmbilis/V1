const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  selectedCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Currently active Google Ads customer ID'
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Tenant-specific settings'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'tenants',
  underscored: true
});

module.exports = Tenant;
