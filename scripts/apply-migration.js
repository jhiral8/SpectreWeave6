#!/usr/bin/env node

/**
 * Migration Application Script
 * 
 * This script helps apply the database migration for children's book integration.
 * Run this script with Node.js to apply the migration to your Supabase database.
 * 
 * Usage: node scripts/apply-migration.js
 * 
 * Prerequisites:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * - Or you can run the SQL manually in the Supabase dashboard
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Children\'s Book Integration Migration Helper\n');

// Read the migration SQL file
const migrationPath = path.join(__dirname, 'complete-integration-migration.sql');

try {
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📖 Migration SQL loaded successfully!\n');
  console.log('📋 To apply this migration, you have several options:\n');
  
  console.log('🔹 Option 1: Supabase Dashboard (Recommended)');
  console.log('   1. Go to your Supabase dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy and paste the SQL below');
  console.log('   4. Click "Run"\n');
  
  console.log('🔹 Option 2: Supabase CLI');
  console.log('   1. Ensure you\'re authenticated: supabase login');
  console.log('   2. Run: supabase db push --linked');
  console.log('   3. Or run the SQL directly with: supabase db reset\n');
  
  console.log('🔹 Option 3: Direct Database Connection');
  console.log('   Use psql or your preferred PostgreSQL client\n');
  
  console.log('═'.repeat(80));
  console.log('📜 MIGRATION SQL:');
  console.log('═'.repeat(80));
  console.log(migrationSQL);
  console.log('═'.repeat(80));
  
  console.log('\n✨ After running the migration:');
  console.log('   - Books can optionally link to projects');
  console.log('   - Projects can be specifically marked as children\'s books');
  console.log('   - Both standalone and integrated workflows will work');
  console.log('   - No existing data will be affected\n');
  
  // Try to detect environment variables
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Supabase environment variables detected');
    console.log('🔄 You could programmatically apply this migration');
    console.log('   (Implementation would require additional dependencies)\n');
  } else {
    console.log('ℹ️  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable');
    console.log('   programmatic migration application\n');
  }
  
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  console.log('\n💡 Make sure you\'re running this from the project root:');
  console.log('   node scripts/apply-migration.js');
}