const fs = require('fs')
const path = require('path')

// Helper to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Convert Next.js API route to Netlify Function
function convertRoute(srcPath, destPath) {
  console.log(`Converting ${srcPath} -> ${destPath}`)
  
  const content = fs.readFileSync(srcPath, 'utf8')
  
  // Extract imports and main handler logic
  const lines = content.split('\n')
  let imports = []
  let handlerFunctions = []
  let currentFunction = null
  let functionBody = []
  let bracketDepth = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Collect imports (but filter out Next.js specific ones)
    if (line.startsWith('import ') && !line.includes('next/server')) {
      // Convert relative imports to absolute paths from project root
      if (line.includes('@/')) {
        imports.push(line.replace('@/', '../../../src/'))
      } else if (line.includes('./') || line.includes('../')) {
        // Convert relative imports - this is tricky, we'll make them absolute
        const relativePath = line.match(/from ['"]([^'"]+)['"]/)?.[1]
        if (relativePath) {
          const newPath = relativePath.startsWith('./') 
            ? relativePath.replace('./', '../../../src/app/api/' + path.dirname(srcPath.replace(/.*\/api\//, '')) + '/')
            : relativePath.replace('../', '../../../src/app/api/')
          imports.push(line.replace(/from ['"][^'"]+['"]/, `from '${newPath}'`))
        }
      } else {
        imports.push(line)
      }
    }
    
    // Detect handler functions
    if (line.match(/^export async function (GET|POST|PUT|DELETE|PATCH)/)) {
      if (currentFunction) {
        handlerFunctions.push({ method: currentFunction, body: functionBody.join('\n') })
      }
      currentFunction = line.match(/^export async function (\w+)/)?.[1]
      functionBody = []
      bracketDepth = 0
    }
    
    if (currentFunction) {
      // Count brackets to know when function ends
      bracketDepth += (line.match(/{/g) || []).length
      bracketDepth -= (line.match(/}/g) || []).length
      
      // Transform NextRequest/NextResponse to our utilities
      let transformedLine = line
        .replace(/NextRequest/g, 'Request')
        .replace(/NextResponse\.json\((.*?)\)/g, 'jsonResponse($1)')
        .replace(/request: NextRequest/g, 'request: Request')
        .replace(/NextResponse\.json\(/g, 'jsonResponse(')
      
      functionBody.push(transformedLine)
      
      // Function ended
      if (bracketDepth === 0 && line.includes('}')) {
        handlerFunctions.push({ method: currentFunction, body: functionBody.join('\n') })
        currentFunction = null
        functionBody = []
      }
    }
  }
  
  // Generate Netlify function
  const netlifyFunction = `
import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
${imports.join('\n')}

export const handler = createNetlifyHandler({
${handlerFunctions.map(fn => `
  ${fn.method}: async (request: Request) => {
    ${fn.body.replace(/^export async function \w+\(request: \w+\) {/, '').replace(/}$/, '')}
  }`).join(',\n')}
})
`.trim()
  
  // Ensure destination directory exists
  ensureDir(path.dirname(destPath))
  
  // Write the converted function
  fs.writeFileSync(destPath, netlifyFunction)
}

// Get all API routes
function getAllApiRoutes() {
  const apiDir = 'src/app/api'
  const routes = []
  
  function scanDir(dir, relativePath = '') {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDir(fullPath, path.join(relativePath, item))
      } else if (item === 'route.ts') {
        routes.push({
          src: fullPath,
          path: relativePath,
          dest: path.join('netlify/functions', relativePath + '.ts')
        })
      }
    }
  }
  
  scanDir(apiDir)
  return routes
}

// Main conversion process
function main() {
  console.log('🚀 Converting Next.js API routes to Netlify Functions...')
  
  const routes = getAllApiRoutes()
  console.log(`Found ${routes.length} API routes to convert`)
  
  let converted = 0
  let errors = 0
  
  for (const route of routes) {
    try {
      convertRoute(route.src, route.dest)
      converted++
    } catch (error) {
      console.error(`❌ Error converting ${route.src}:`, error.message)
      errors++
    }
  }
  
  console.log(`\\n✅ Conversion complete!`)
  console.log(`   Converted: ${converted}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total: ${routes.length}`)
  
  if (errors > 0) {
    console.log('\\n⚠️  Some routes had errors and may need manual fixes')
  }
}

if (require.main === module) {
  main()
}

module.exports = { convertRoute, getAllApiRoutes }