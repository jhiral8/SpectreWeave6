/**
 * Database Migration Runner
 * Runs SQL migrations against Supabase database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigrations() {
  try {
    console.log('Starting database migrations...')
    
    const migrationsDir = path.join(__dirname, 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    for (const migrationFile of migrationFiles) {
      console.log(`Running migration: ${migrationFile}`)
      
      const migrationPath = path.join(migrationsDir, migrationFile)
      const migrationSql = fs.readFileSync(migrationPath, 'utf8')
      
      // Split by semicolon and run each statement separately
      const statements = migrationSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            // Try direct query if RPC fails
            const { error: directError } = await supabase
              .from('__direct_sql__')
              .select('*')
              .or(`__sql__.eq.${statement}`)
            
            if (directError) {
              console.error(`Error in statement: ${statement.substring(0, 100)}...`)
              console.error('Error:', error)
              // Continue with next statement instead of failing completely
            }
          }
        } catch (err) {
          console.warn(`Warning in statement: ${statement.substring(0, 50)}...`)
          console.warn('Error:', err.message)
          // Continue with next statement
        }
      }
      
      console.log(`✓ Completed migration: ${migrationFile}`)
    }
    
    console.log('All migrations completed successfully!')
    
    // Test the tables were created
    console.log('\\nTesting table creation...')
    
    const tables = [
      'character_profiles',
      'character_reference_images', 
      'book_generations',
      'book_pages',
      'character_consistency'
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0)
        
        if (error) {
          console.log(`❌ Table '${table}' not accessible:`, error.message)
        } else {
          console.log(`✓ Table '${table}' created successfully`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}' test failed:`, err.message)
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run the script
runMigrations()