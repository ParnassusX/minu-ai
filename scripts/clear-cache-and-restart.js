#!/usr/bin/env node

/**
 * Cache Clearing and Development Server Restart Script
 * Ensures consistent generator interface by clearing all caches
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🧹 Clearing all caches and restarting development server...\n')

// Function to safely remove directory
function removeDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true })
      console.log(`✅ Removed: ${dirPath}`)
    }
  } catch (error) {
    console.log(`⚠️  Could not remove ${dirPath}: ${error.message}`)
  }
}

// Function to safely remove file
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✅ Removed: ${filePath}`)
    }
  } catch (error) {
    console.log(`⚠️  Could not remove ${filePath}: ${error.message}`)
  }
}

// 1. Clear Next.js cache
console.log('1️⃣ Clearing Next.js cache...')
removeDir('.next')
removeDir('out')
removeFile('.next.cache')

// 2. Clear node_modules cache
console.log('\n2️⃣ Clearing node_modules cache...')
removeDir('node_modules/.cache')

// 3. Clear npm/yarn cache
console.log('\n3️⃣ Clearing package manager cache...')
try {
  execSync('npm cache clean --force', { stdio: 'inherit' })
  console.log('✅ NPM cache cleared')
} catch (error) {
  console.log('⚠️  Could not clear NPM cache')
}

// 4. Clear browser cache instructions
console.log('\n4️⃣ Browser cache clearing instructions:')
console.log('📋 To clear browser cache:')
console.log('   • Chrome: Ctrl+Shift+R (hard reload)')
console.log('   • Chrome DevTools: Network tab → Disable cache')
console.log('   • Or use Incognito/Private window')
console.log('   • Clear browser data: Settings → Privacy → Clear browsing data')

// 5. Kill any existing processes on port 4000
console.log('\n5️⃣ Checking for processes on port 4000...')
try {
  // Windows
  if (process.platform === 'win32') {
    try {
      const result = execSync('netstat -ano | findstr :4000', { encoding: 'utf8' })
      if (result) {
        console.log('🔍 Found processes on port 4000, attempting to kill...')
        const lines = result.split('\n').filter(line => line.includes(':4000'))
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          if (pid && !isNaN(pid)) {
            try {
              execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
              console.log(`✅ Killed process ${pid}`)
            } catch (e) {
              console.log(`⚠️  Could not kill process ${pid}`)
            }
          }
        })
      }
    } catch (e) {
      console.log('✅ No processes found on port 4000')
    }
  } else {
    // Unix/Linux/Mac
    try {
      execSync('lsof -ti:4000 | xargs kill -9', { stdio: 'ignore' })
      console.log('✅ Killed processes on port 4000')
    } catch (e) {
      console.log('✅ No processes found on port 4000')
    }
  }
} catch (error) {
  console.log('⚠️  Could not check/kill processes on port 4000')
}

// 6. Reinstall dependencies (optional, only if needed)
const shouldReinstall = process.argv.includes('--reinstall')
if (shouldReinstall) {
  console.log('\n6️⃣ Reinstalling dependencies...')
  try {
    removeDir('node_modules')
    removeFile('package-lock.json')
    execSync('npm install', { stdio: 'inherit' })
    console.log('✅ Dependencies reinstalled')
  } catch (error) {
    console.log('❌ Failed to reinstall dependencies')
    process.exit(1)
  }
}

// 7. Start development server
console.log('\n7️⃣ Starting development server on port 4000...')
console.log('🚀 Running: npm run dev')
console.log('📱 App will be available at: http://localhost:4000')
console.log('🎯 Generator will be at: http://localhost:4000/generator')
console.log('\n⚡ Starting server...\n')

try {
  execSync('npm run dev', { stdio: 'inherit' })
} catch (error) {
  console.log('\n❌ Failed to start development server')
  console.log('💡 Try running manually: npm run dev')
  process.exit(1)
}
