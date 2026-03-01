/**
 * Slide Export Script
 *
 * Exports slides to PNG images and optionally combines them into a PDF.
 *
 * Usage:
 *   node scripts/export-slides.cjs                      # Export all PNGs
 *   node scripts/export-slides.cjs --pdf                # Export PNGs and create PDF
 *   node scripts/export-slides.cjs --pdf-only           # Create PDF from existing PNGs
 *   node scripts/export-slides.cjs --slides 1,3,5-7     # Export specific slides
 *   node scripts/export-slides.cjs --slides 2-5 --pdf   # Export range + PDF
 *   node scripts/export-slides.cjs --quality medium     # PDF quality: high/medium/low
 *
 * Requirements:
 *   - Dev server must be running (npm run dev)
 *   - puppeteer and pdf-lib must be installed
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Parse CLI arguments first to get theme
const args = process.argv.slice(2);
const shouldCreatePdf = args.includes('--pdf') || args.includes('--pdf-only');
const pdfOnly = args.includes('--pdf-only');

// Parse --theme argument
function getTheme() {
  const themeIdx = args.indexOf('--theme');
  if (themeIdx !== -1 && args[themeIdx + 1]) {
    const t = args[themeIdx + 1];
    if (t === 'light' || t === 'dark') return t;
  }
  return process.env.EXPORT_THEME || 'dark';
}

// Parse --quality argument (for PDF)
function getQuality() {
  const qualityIdx = args.indexOf('--quality');
  if (qualityIdx !== -1 && args[qualityIdx + 1]) {
    const q = args[qualityIdx + 1].toLowerCase();
    if (['high', 'medium', 'low'].includes(q)) return q;
  }
  return 'medium'; // Default to medium for reasonable file size
}

// Quality presets
const QUALITY_PRESETS = {
  high: { scale: 2, jpegQuality: 92 },    // ~600KB per slide
  medium: { scale: 1.5, jpegQuality: 85 }, // ~300KB per slide
  low: { scale: 1, jpegQuality: 75 },      // ~150KB per slide
};

// Configuration
const PORT = process.env.EXPORT_PORT || '5173';
const THEME = getTheme();
const QUALITY = getQuality();
const QUALITY_SETTINGS = QUALITY_PRESETS[QUALITY];
const BASE_URL = `http://localhost:${PORT}?theme=${THEME}`;
const OUTPUT_DIR = path.join(__dirname, '..', 'export');
const VIEWPORT = { width: 1920, height: 1080, deviceScaleFactor: QUALITY_SETTINGS.scale };

// Parse --slides argument
const slidesIdx = args.indexOf('--slides');
const slideSet = slidesIdx !== -1 && args[slidesIdx + 1]
  ? parseSlides(args[slidesIdx + 1])
  : null;

/**
 * Parse a slide selection string into a Set of 1-based slide numbers.
 * Supports: "3", "1,5", "3-7", "1,3,5-7,12"
 */
function parseSlides(arg) {
  const result = new Set();
  for (const token of arg.split(',')) {
    if (token.includes('-')) {
      const [start, end] = token.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start > end) {
        throw new Error(`Invalid slide range: ${token}`);
      }
      for (let i = start; i <= end; i++) result.add(i);
    } else {
      const n = Number(token);
      if (isNaN(n) || n < 1) {
        throw new Error(`Invalid slide number: ${token}`);
      }
      result.add(n);
    }
  }
  return result;
}

/**
 * Simple delay helper
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for animations to complete.
 * Polls the data-animations-complete attribute, with fallback to fixed delay.
 */
async function waitForAnimations(page, minWait = 2000, maxWait = 10000) {
  const pollInterval = 100;
  const startTime = Date.now();

  // Always wait minimum time for transitions to start
  await delay(minWait);

  // Then poll for completion
  while (Date.now() - startTime < maxWait) {
    try {
      const complete = await page.$eval('[data-animations-complete]', (el) =>
        el.getAttribute('data-animations-complete') === 'true'
      );

      if (complete) {
        // Extra buffer for final rendering
        await delay(400);
        return;
      }
    } catch (e) {
      // Attribute not found, fall back to fixed delay
      console.warn('Warning: Could not check animation state, using fixed delay');
      await delay(1500);
      return;
    }

    await delay(pollInterval);
  }

  // Timeout - add extra buffer anyway
  console.warn('Warning: Animation wait timed out');
  await delay(500);
}

/**
 * Get total slide count from data attribute
 */
async function getSlideCount(page) {
  try {
    const total = await page.$eval('[data-slide-total]', (el) =>
      el.getAttribute('data-slide-total')
    );
    if (total) {
      return parseInt(total, 10);
    }
  } catch (e) {
    // Fall back to parsing visible counter
  }

  // Fallback: parse from visible counter
  try {
    const counter = await page.$eval('.text-caption', (el) => el.textContent);
    const match = counter.match(/\d+\s*\/\s*(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (e) {
    // Ignore
  }

  throw new Error('Could not determine slide count');
}

/**
 * Get current slide number from data attribute
 */
async function getCurrentSlide(page) {
  try {
    const current = await page.$eval('[data-slide-current]', (el) =>
      el.getAttribute('data-slide-current')
    );
    if (current) {
      return parseInt(current, 10);
    }
  } catch (e) {
    // Fall back to parsing visible counter
  }

  // Fallback: parse from visible counter
  try {
    const counter = await page.$eval('.text-caption', (el) => el.textContent);
    const match = counter.match(/(\d+)\s*\/\s*\d+/);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (e) {
    // Ignore
  }

  return 0;
}

/**
 * Navigate to next slide and wait for it to be ready
 */
async function navigateToNextSlide(page, expectedSlide) {
  await page.keyboard.press('ArrowRight');

  // Wait for slide to change (poll for up to 3 seconds)
  const startTime = Date.now();
  while (Date.now() - startTime < 3000) {
    const current = await getCurrentSlide(page);
    if (current === expectedSlide) {
      break;
    }
    await delay(50);
  }

  // Wait for animations
  await waitForAnimations(page);
}

/**
 * Export slides to images
 * @param {Set<number>|null} selectedSlides - 1-based slide numbers to capture, or null for all
 * @param {boolean} forPdf - If true, capture as JPEG for smaller PDF size
 */
async function exportSlides(selectedSlides, forPdf = false) {
  const format = forPdf ? 'jpeg' : 'png';
  const ext = forPdf ? 'jpg' : 'png';

  console.log(`Launching browser (${QUALITY} quality)...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Loading ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

  // Initial page load - wait generously
  console.log('Waiting for initial render...');
  await delay(2000);
  await waitForAnimations(page);

  // Get total slide count
  const totalSlides = await getSlideCount(page);
  console.log(`Found ${totalSlides} slides`);

  const screenshots = [];

  for (let i = 0; i < totalSlides; i++) {
    const slideNum = i + 1;
    const shouldCapture = !selectedSlides || selectedSlides.has(slideNum);

    // Verify we're on the correct slide
    const currentSlide = await getCurrentSlide(page);
    if (currentSlide !== slideNum) {
      console.warn(`Warning: Expected slide ${slideNum} but on slide ${currentSlide}`);
    }

    if (shouldCapture) {
      const filename = `slide-${String(slideNum).padStart(2, '0')}.${ext}`;
      const filepath = path.join(OUTPUT_DIR, filename);

      console.log(`Capturing slide ${slideNum}/${totalSlides}...`);

      const screenshotOptions = {
        path: filepath,
        fullPage: false,
        type: format,
      };

      // Add quality for JPEG
      if (format === 'jpeg') {
        screenshotOptions.quality = QUALITY_SETTINGS.jpegQuality;
      }

      await page.screenshot(screenshotOptions);
      screenshots.push(filepath);
    } else {
      console.log(`Skipping slide ${slideNum}/${totalSlides}`);
    }

    // Navigate to next slide if not on the last one
    if (i < totalSlides - 1) {
      await navigateToNextSlide(page, slideNum + 1);
    }
  }

  await browser.close();
  console.log(`\nExported ${screenshots.length} ${ext.toUpperCase()} files to ${OUTPUT_DIR}`);
  return screenshots;
}

/**
 * Export slides to PNG images (for standalone use)
 */
async function exportToPng(selectedSlides) {
  return exportSlides(selectedSlides, false);
}

/**
 * Combine images into a PDF with JPEG compression for smaller file size
 */
async function createPdf(imageFiles) {
  console.log(`\nCreating PDF (${QUALITY} quality)...`);

  const pdfDoc = await PDFDocument.create();

  // Sort files to ensure correct order
  imageFiles.sort();

  for (const imagePath of imageFiles) {
    const imageBytes = fs.readFileSync(imagePath);

    let image;
    let scale = QUALITY_SETTINGS.scale;

    if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      // For PNG files, embed as PNG (pdf-lib doesn't support PNG to JPEG conversion)
      // Consider using sharp for conversion if installed
      image = await pdfDoc.embedPng(imageBytes);
    }

    // Use the image dimensions (scaled down from capture scale)
    const pageWidth = image.width / scale;
    const pageHeight = image.height / scale;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfPath = path.join(OUTPUT_DIR, 'slides.pdf');
  fs.writeFileSync(pdfPath, pdfBytes);

  const sizeMB = (pdfBytes.length / 1024 / 1024).toFixed(1);
  console.log(`Created PDF: ${pdfPath} (${sizeMB} MB)`);
  return pdfPath;
}

/**
 * Get existing image files from export directory (prefers JPEG over PNG)
 * @param {Set<number>|null} selectedSlides - 1-based slide numbers to include, or null for all
 */
function getExistingImages(selectedSlides) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(OUTPUT_DIR);

  // Check if we have JPEGs (preferred for PDF)
  const jpegFiles = files.filter(f => f.endsWith('.jpg') && f.startsWith('slide-'));
  const pngFiles = files.filter(f => f.endsWith('.png') && f.startsWith('slide-'));

  // Prefer JPEG if available
  const sourceFiles = jpegFiles.length > 0 ? jpegFiles : pngFiles;
  const ext = jpegFiles.length > 0 ? 'jpg' : 'png';

  return sourceFiles
    .filter(f => {
      if (!selectedSlides) return true;
      const match = f.match(/slide-(\d+)\./);
      return match && selectedSlides.has(parseInt(match[1], 10));
    })
    .map(f => path.join(OUTPUT_DIR, f))
    .sort();
}

/**
 * Get existing PNG files from export directory (legacy, for backwards compatibility)
 */
function getExistingPngs(selectedSlides) {
  return getExistingImages(selectedSlides);
}

/**
 * Main entry point
 */
async function main() {
  try {
    let imageFiles;

    if (pdfOnly) {
      // Use existing images (prefer JPEG, fall back to PNG)
      imageFiles = getExistingImages(slideSet);
      if (imageFiles.length === 0) {
        console.error('Error: No image files found in export directory. Run without --pdf-only first.');
        process.exit(1);
      }
      console.log(`Found ${imageFiles.length} existing image files`);
    } else if (shouldCreatePdf) {
      // Export as JPEG for smaller PDF
      imageFiles = await exportSlides(slideSet, true);
    } else {
      // Export as PNG for highest quality standalone images
      imageFiles = await exportToPng(slideSet);
    }

    if (shouldCreatePdf) {
      await createPdf(imageFiles);
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Export failed:', error.message);
    process.exit(1);
  }
}

main();
