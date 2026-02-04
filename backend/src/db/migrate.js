const { syncDatabase } = require('../models');

async function migrate() {
  console.log('🔄 Running database migrations...');
  
  const force = process.argv.includes('--force');
  
  if (force) {
    console.log('⚠️  WARNING: Running with --force flag (will drop all tables)');
    console.log('⏳ Waiting 3 seconds... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  try {
    await syncDatabase(force);
    console.log('✅ Database migration completed successfully!');
    
    if (!force) {
      console.log('\n📝 Note: Tables were created/altered without data loss');
      console.log('   To drop and recreate all tables, use: npm run migrate -- --force');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
