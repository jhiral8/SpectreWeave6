// Script to apply children's books migration to Supabase
// Run with: node scripts/apply-childrens-books-migration.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying children\'s books migration...');

  try {
    // Check if project_type column exists
    const { data: columns, error: columnsError } = await supabase
      .from('projects')
      .select('*')
      .limit(0);

    if (columnsError) {
      console.log('Note: Could not check existing columns:', columnsError.message);
    }

    // Apply migration via RPC or direct SQL (if available)
    // For now, we'll just verify the tables exist
    
    // Test if we can access projects table with new columns
    const { data: testProjects, error: testError } = await supabase
      .from('projects')
      .select('id, title, project_type')
      .limit(1);

    if (testError && testError.message.includes('project_type')) {
      console.log('project_type column does not exist yet.');
      console.log('\nPlease run the following SQL in your Supabase SQL editor:');
      console.log('----------------------------------------');
      console.log(`
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'manuscript',
ADD COLUMN IF NOT EXISTS target_age VARCHAR(10),
ADD COLUMN IF NOT EXISTS book_theme VARCHAR(50),
ADD COLUMN IF NOT EXISTS illustration_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS author_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_pages INTEGER,
ADD COLUMN IF NOT EXISTS book_metadata JSONB DEFAULT '{}';
      `);
      console.log('----------------------------------------');
      console.log('\nAfter running the SQL, the children\'s books feature will work properly.');
    } else if (testError) {
      console.error('Error accessing projects table:', testError);
    } else {
      console.log('✓ project_type column exists');
      
      // Check if we have any children's book projects
      const { data: childrenBooks, error: booksError } = await supabase
        .from('projects')
        .select('*')
        .eq('project_type', 'childrens-book');

      if (!booksError) {
        console.log(`✓ Found ${childrenBooks?.length || 0} children's book projects`);
      }
    }

    // Check if book-related tables exist
    const tables = ['books', 'book_pages', 'book_generations', 'book_templates'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`✗ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`⚠ Table '${table}' check failed:`, error.message);
      } else {
        console.log(`✓ Table '${table}' exists`);
      }
    }

    console.log('\nMigration check complete!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();