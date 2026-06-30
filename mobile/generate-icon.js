const fs = require('fs');
const path = require('path');

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('sharp not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit', cwd: path.join(__dirname) });
    sharp = require('sharp');
  }

  const svgPath = path.join(__dirname, 'assets', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // App icon 1024x1024
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  await sharp(svgBuffer).resize(1024, 1024).png().toFile(iconPath);
  console.log('Created icon.png (1024x1024)');

  // Adaptive icon 1024x1024
  const adaptivePath = path.join(__dirname, 'assets', 'icon-adaptive.png');
  await sharp(svgBuffer).resize(1024, 1024).png().toFile(adaptivePath);
  console.log('Created icon-adaptive.png (1024x1024)');

  // Android mipmap sizes
  const mipmapDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
  const sizes = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const { name, size } of sizes) {
    const dir = path.join(mipmapDir, name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Regular icon
    const regularPath = path.join(dir, 'ic_launcher.png');
    await sharp(svgBuffer).resize(size, size).png().toFile(regularPath);

    // Round icon
    const roundPath = path.join(dir, 'ic_launcher_round.png');
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(roundPath);

    // Foreground icon for adaptive icon
    const foregroundPath = path.join(dir, 'ic_launcher_foreground.png');
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(foregroundPath);

    console.log(`Created ${name}: ${size}x${size}`);
  }

  console.log('\nAll icons generated!');
}

generateIcons().catch(console.error);
