// Complete app data clear script
// Run this with: node CLEAR_APP_DATA.js

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing ALL mobile app data and cache...\n');

const pathsToDelete = [
  'node_modules/.cache',
  '.expo',
  'android/.gradle',
  'android/app/build',
  'ios/build',
  'ios/Pods',
];

let deletedCount = 0;

pathsToDelete.forEach(dirPath => {
  const fullPath = path.join(__dirname, dirPath);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Deleted: ${dirPath}`);
      deletedCount++;
    } else {
      console.log(`⏭️  Skipped: ${dirPath} (not found)`);
    }
  } catch (error) {
    console.log(`❌ Failed to delete ${dirPath}:`, error.message);
  }
});

console.log(`\n✅ Cleared ${deletedCount} cache directories`);
console.log('\n📱 Next steps:');
console.log('1. Close Expo app completely on your phone');
console.log('2. Run: npm start -- --clear');
console.log('3. Scan QR code again');
console.log('4. App will start fresh with no cached data\n');
