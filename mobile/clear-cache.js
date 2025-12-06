// Clear mobile app cache and storage
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing mobile app cache...\n');

const pathsToDelete = [
  'node_modules/.cache',
  '.expo',
  'android/.gradle',
  'android/app/build',
  'ios/build',
];

pathsToDelete.forEach(dirPath => {
  const fullPath = path.join(__dirname, dirPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ Deleted: ${dirPath}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    console.log(`⏭️  Skipped: ${dirPath} (not found)`);
  }
});

console.log('\n✅ Cache cleared! Run: npm start -- --clear');
