const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database')
const { encrypt, decrypt } = require('../../utils/encryption');

const GoogleAccount = sequelize.define('GoogleAccount', {
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
  googleUserEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  refreshTokenEnc: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Encrypted refresh token'
  },
  scopes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'OAuth scopes granted'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'error'),
    defaultValue: 'active'
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'google_accounts',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'google_user_email']
    }
  ]
});

// Virtual field for decrypted refresh token
GoogleAccount.prototype.getRefreshToken = function() {
  return decrypt(this.refreshTokenEnc);
};

GoogleAccount.prototype.setRefreshToken = function(token) {
  this.refreshTokenEnc = encrypt(token);
};

module.exports = GoogleAccount;
