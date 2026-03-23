const fs = require('fs')
const path = require('path')

const src = 'C:/Users/Keerthivasan.A/OneDrive/Documents/Desktop/logo.png'
const dst = path.join(__dirname, 'frontend/public/logo.png')

try {
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.copyFileSync(src, dst)
  console.log('Logo copied successfully to:', dst)
} catch (e) {
  console.error('Error:', e.message)
}
