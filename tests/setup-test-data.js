/**
 * Test Data Setup
 * Create test images and data for E2E testing
 */

const fs = require('fs')
const path = require('path')

// Create test images directory
const testImagesDir = path.join(__dirname, '..', 'test-results', 'test-images')

if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true })
}

// Create a simple test image (1x1 pixel PNG)
const createTestImage = (filename) => {
  const imagePath = path.join(testImagesDir, filename)
  
  // Simple 1x1 pixel PNG in base64
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )
  
  fs.writeFileSync(imagePath, pngData)
  console.log(`✅ Created test image: ${filename}`)
  
  return imagePath
}

// Create test images
const testImages = [
  'test-image.jpg',
  'test-upload.jpg',
  'kontext-pro-input.jpg',
  'seedance-input.jpg',
  'variation-base.jpg',
  'seamless-upload.jpg',
  'real-upload-test.jpg'
]

console.log('🖼️ Setting up test images...')

testImages.forEach(createTestImage)

console.log(`✅ Test data setup complete. Images saved to: ${testImagesDir}`)

module.exports = {
  testImagesDir,
  createTestImage
}
