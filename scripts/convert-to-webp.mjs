import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const imageRoots = [
  path.join(rootDir, 'src', 'assets', 'imgs'),
  path.join(rootDir, 'public', 'assets', 'imgs'),
];

const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff', '.webp']);

function listFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];

  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...listFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

async function convertFile(inputFile) {
  const ext = path.extname(inputFile).toLowerCase();
  if (!supportedExtensions.has(ext) || ext === '.webp') return;

  const outputFile = inputFile.replace(new RegExp(`${ext}$`, 'i'), '.webp');

  if (fs.existsSync(outputFile)) {
    const inputStat = fs.statSync(inputFile);
    const outputStat = fs.statSync(outputFile);

    if (outputStat.mtimeMs >= inputStat.mtimeMs) {
      return;
    }
  }

  await sharp(inputFile)
    .webp({ quality: 80, effort: 6 })
    .toFile(outputFile);

  console.log(`Converted ${path.relative(rootDir, inputFile)} -> ${path.relative(rootDir, outputFile)}`);
}

async function main() {
  for (const imageRoot of imageRoots) {
    const files = listFilesRecursively(imageRoot);

    for (const file of files) {
      try {
        await convertFile(file);
      } catch (error) {
        console.error(`Failed to convert ${file}:`, error.message);
      }
    }
  }
}

main().catch((error) => {
  console.error('WebP conversion failed:', error);
  process.exit(1);
});
