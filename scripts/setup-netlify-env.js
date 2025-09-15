const fs = require('fs')
const path = require('path')

/**
 * Helper script to generate Netlify environment variable commands
 */

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    return []
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const envVars = []

  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') continue
    
    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      envVars.push({ key: key.trim(), value: value.trim() })
    }
  }

  return envVars
}

function generateNetlifyCommands(envVars) {
  console.log('🚀 Netlify Environment Variable Setup Commands\n')
  console.log('Run these commands in your Netlify CLI:\n')

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'STABILITY_API_KEY'
  ]

  const optionalVars = [
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'DATABRICKS_API_TOKEN',
    'NEXT_PUBLIC_ABLY_API_KEY',
    'HUGGINGFACE_API_KEY',
    'NEO4J_PASSWORD',
    'NEXTAUTH_SECRET'
  ]

  // Required variables
  console.log('📋 REQUIRED Variables:')
  console.log('='.repeat(50))
  
  for (const { key, value } of envVars) {
    if (requiredVars.includes(key)) {
      const displayValue = value.includes('your-') || value.includes('here') 
        ? '<REPLACE_WITH_ACTUAL_VALUE>'
        : value
      
      console.log(`netlify env:set ${key} "${displayValue}"`)
    }
  }

  console.log('\n🔧 OPTIONAL Variables (configure as needed):')
  console.log('='.repeat(50))
  
  for (const { key, value } of envVars) {
    if (optionalVars.includes(key)) {
      const displayValue = value.includes('your-') || value.includes('here')
        ? '<REPLACE_WITH_ACTUAL_VALUE>'
        : value
      
      console.log(`netlify env:set ${key} "${displayValue}"`)
    }
  }

  console.log('\n⚙️  SYSTEM Variables (usually don\'t need changes):')
  console.log('='.repeat(50))
  
  for (const { key, value } of envVars) {
    if (!requiredVars.includes(key) && !optionalVars.includes(key)) {
      console.log(`netlify env:set ${key} "${value}"`)
    }
  }

  console.log('\n📝 Alternative: Bulk upload via Netlify UI')
  console.log('='.repeat(50))
  console.log('You can also copy-paste these to Netlify Dashboard → Site Settings → Environment Variables:')
  console.log('')
  
  for (const { key, value } of envVars) {
    console.log(`${key}=${value}`)
  }
}

function generateEnvValidation() {
  console.log('\n\n🔍 Environment Variables Validation Script')
  console.log('='.repeat(50))
  console.log('Add this to your Netlify function to validate environment setup:\n')

  const validationScript = `
// Environment validation for Netlify Functions
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'STABILITY_API_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(\`Missing required environment variables: \${missing.join(', ')}\`)
  }

  console.log('✅ All required environment variables are set')
  return true
}
`

  console.log(validationScript)
}

function main() {
  console.log('🌐 SpectreWeave5 Netlify Environment Setup\n')

  // Parse .env file
  const envVars = parseEnvFile('.env')
  
  if (envVars.length === 0) {
    console.error('❌ No environment variables found in .env file')
    return
  }

  console.log(`✅ Found ${envVars.length} environment variables\\n`)

  // Generate commands
  generateNetlifyCommands(envVars)
  generateEnvValidation()

  console.log('\n🎯 Next Steps:')
  console.log('1. Replace placeholder values with actual API keys')
  console.log('2. Run the netlify env:set commands above')
  console.log('3. Or upload via Netlify Dashboard → Environment Variables')
  console.log('4. Deploy with: npm run netlify:deploy')
}

if (require.main === module) {
  main()
}

module.exports = { parseEnvFile, generateNetlifyCommands }