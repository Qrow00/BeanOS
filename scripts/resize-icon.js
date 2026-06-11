const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.resolve(__dirname, '../assets');
const files = ['icon.png', 'adaptive-icon.png'];

async function main() {
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const meta = await sharp(filePath).metadata();
    const { width, height } = meta;
    const scale = 0.6;
    const newW = Math.round(width * scale);
    const newH = Math.round(height * scale);
    const left = Math.round((width - newW) / 2);
    const top = Math.round((height - newH) / 2);
    const resized = await sharp(filePath).resize(newW, newH, { kernel: 'lanczos3' }).toBuffer();
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resized, top, left }])
      .png()
      .toFile(filePath + '.tmp');
    fs.renameSync(filePath + '.tmp', filePath);
    console.log(`Resized ${file}: ${width}x${height} -> centered at ${scale * 100}% size`);
  }
}

main().catch(console.error);
