const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database')

const TenantUser = sequelize.define('TenantUser', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'member', 'viewer'),
    defaultValue: 'member',
    comment: 'admin: full access, member: read/write, viewer: read-only'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'tenant_users',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'user_id']
    }
  ]
});

module.exports = TenantUser;
