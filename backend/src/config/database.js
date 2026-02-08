const { Sequelize } = require('sequelize');
require('dotenv').config();

// CLI ve Uygulama için ortak konfigürasyon objesi
const dbConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    // Uzak bağlantılarda (Supabase vb.) SSL gerekebilir, hata alırsan burayı düzenleyebiliriz
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
};

// Uygulama içinde kullanılacak olan Sequelize instance'ı
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Test connection fonksiyonu
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// HEM uygulama HEM CLI için export yapısı
module.exports = {
  sequelize,      // Uygulama kullanımı için: const { sequelize } = require('./database')
  testConnection, // Test için
  development: dbConfig, // CLI (npx sequelize-cli ...) kullanımı için
  production: dbConfig   // Canlı ortam CLI kullanımı için
};