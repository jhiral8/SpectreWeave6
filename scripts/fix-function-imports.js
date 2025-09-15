const fs = require('fs')
const path = require('path')

// Fix import paths in Netlify functions
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  
  // Fix @/ imports to relative paths from netlify/functions to src/
  const lines = content.split('\n')
  const fixedLines = lines.map(line => {
    if (line.includes('import ') && line.includes('@/')) {
      // Calculate depth from netlify/functions/... to project root
      const relativePath = path.relative(path.dirname(filePath), '.')
      const srcPath = path.join(relativePath, 'src').replace(/\\\\/g, '/')
      
      const fixed = line.replace(/@\//g, srcPath + '/')
      if (fixed !== line) {
        changed = true
        console.log(`  Fixed import: ${line.trim()} → ${fixed.trim()}`)
      }
      return fixed
    }
    return line
  })
  
  if (changed) {
    fs.writeFileSync(filePath, fixedLines.join('\n'))
  }
  
  return changed
}

// Recursively fix all .ts files in netlify/functions
function fixAllImports(dir = 'netlify/functions') {
  let totalFixed = 0
  let totalFiles = 0
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else if (item.endsWith('.ts')) {
        totalFiles++
        console.log(`Checking ${fullPath}...`)
        
        if (fixImports(fullPath)) {
          totalFixed++
        }
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    scanDir(dir)
  }
  
  return { totalFixed, totalFiles }
}

// Main function
function main() {
  console.log('🔧 Fixing import paths in Netlify Functions...\n')
  
  const { totalFixed, totalFiles } = fixAllImports()
  
  console.log(`\n✅ Import path fixing complete!`)
  console.log(`   Files checked: ${totalFiles}`)
  console.log(`   Files fixed: ${totalFixed}`)
  
  if (totalFixed > 0) {
    console.log('\\n📝 Import paths have been updated to use relative paths from netlify/functions to src/')
  }
}

if (require.main === module) {
  main()
}

module.exports = { fixImports, fixAllImports }