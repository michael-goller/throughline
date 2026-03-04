const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OUTPUT_PATH = path.join(__dirname, '../dist/GoogleSlidesGenerator.gs');

// 1. Execute the TypeScript extractor script to get clean JSON
console.log('Extracting slide data from React config...');
let slidesData;
try {
  const output = execSync('npx tsx templates/slide-deck/scripts/extract-slides.ts', { 
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'] 
  });
  
  const jsonStart = output.indexOf('[');
  const jsonEnd = output.lastIndexOf(']') + 1;
  
  if (jsonStart === -1 || jsonEnd === 0) {
    throw new Error('No JSON array found in output');
  }
  
  const jsonStr = output.substring(jsonStart, jsonEnd);
  slidesData = JSON.parse(jsonStr);
  
} catch (e) {
  console.error('Failed to extract slide data:', e.message);
  process.exit(1);
}

// 2. The Google Apps Script Template with "Beautiful" Renderers
const appsScriptTemplate = (data) => `
/**
 * ------------------------------------------------------------------
 * GOOGLE SLIDES GENERATOR (PRO)
 * Auto-generated from React Slide Deck
 * ------------------------------------------------------------------
 */

// THE DATA
const SLIDE_DATA = ${JSON.stringify(data, null, 2)};

// THEME CONFIGURATION
const THEME = {
  colors: {
    primary: '#E6332A', // Avery Red
    dark: '#121212',    // True Dark background
    card: '#1E1E1E',    // Lighter dark for cards
    white: '#FFFFFF',
    textDark: '#1A202C',
    textLight: '#E2E8F0',
    gray: '#718096',
    border: '#2D3748',
    shadow: '#000000',
    success: '#38A169', // Green for "After" comparisons
    muted: '#A0AEC0'
  },
  fonts: {
    heading: 'Nunito Sans',
    body: 'Nunito Sans'
  }
};

function generateDeck() {
  const presentation = SlidesApp.getActivePresentation();
  
  SLIDE_DATA.forEach((slideConfig, index) => {
    Logger.log('Generating slide ' + (index + 1) + ': ' + slideConfig.type);
    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    
    switch (slideConfig.type) {
      case 'title':
      case 'title-digital':
        renderTitleSlide(slide, slideConfig);
        break;
      case 'content':
        renderContentSlide(slide, slideConfig);
        break;
      case 'steps':
        renderStepsSlide(slide, slideConfig);
        break;
      case 'stats':
        renderStatsSlide(slide, slideConfig);
        break;
      case 'quote':
        renderQuoteSlide(slide, slideConfig);
        break;
      case 'divider':
        renderDividerSlide(slide, slideConfig);
        break;
      case 'two-column':
        renderTwoColumnSlide(slide, slideConfig);
        break;
      case 'comparison':
        renderComparisonSlide(slide, slideConfig);
        break;
      case 'timeline':
        renderTimelineSlide(slide, slideConfig);
        break;
      case 'qa':
        renderQASlide(slide, slideConfig);
        break;
      case 'closing':
        renderClosingSlide(slide, slideConfig);
        break;
      default:
        renderGenericSlide(slide, slideConfig);
    }
  });
}

/**
 * HELPER: Draw a "Card" with a manual shadow
 */
function drawCard(slide, x, y, w, h, bgColor, borderColor) {
  // Shadow (offset 4px)
  const shadow = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x + 4, y + 4, w, h);
  shadow.getFill().setSolidFill(THEME.colors.shadow, 0.3);
  shadow.getBorder().setTransparent();
  
  // Card Body
  const card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, w, h);
  card.getFill().setSolidFill(bgColor);
  if (borderColor) {
    card.getBorder().getLineFill().setSolidFill(borderColor);
    card.getBorder().setWeight(1);
  } else {
    card.getBorder().setTransparent();
  }
  return card;
}

/**
 * RENDERER: Title Slide
 */
function renderTitleSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.primary);
  
  // Geometric Pattern (Subtle circles)
  const circle = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, 500, -100, 400, 400);
  circle.getFill().setSolidFill(THEME.colors.white, 0.05);
  circle.getBorder().setTransparent();

  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 60, 140, 600, 150);
  const titleText = titleShape.getText();
  titleText.setText(data.title);
  titleText.getTextStyle()
    .setForegroundColor(THEME.colors.white)
    .setFontSize(60)
    .setFontFamily(THEME.fonts.heading)
    .setBold(true);
    
  if (data.subtitle) {
    const subShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 60, 300, 600, 60);
    subShape.getText().setText(data.subtitle)
      .getTextStyle()
      .setForegroundColor(THEME.colors.textLight)
      .setFontSize(24)
      .setFontFamily(THEME.fonts.body);
  }
}

/**
 * RENDERER: Content Slide
 */
function renderContentSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.white);

  // Accent Marker
  const marker = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 30, 45, 6, 45);
  marker.getFill().setSolidFill(THEME.colors.primary);
  marker.getBorder().setTransparent();

  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, 40, 650, 60);
  titleShape.getText().setText(data.title)
    .getTextStyle()
    .setForegroundColor(THEME.colors.textDark)
    .setFontSize(36)
    .setFontFamily(THEME.fonts.heading)
    .setBold(true);
    
  let currentY = 130;
  if (data.body) {
    const bodyShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, currentY, 630, 100);
    bodyShape.getText().setText(data.body)
      .getTextStyle()
      .setFontSize(18)
      .setForegroundColor('#4A5568')
      .setFontFamily(THEME.fonts.body);
    currentY += 100;
  }
  
  if (data.bullets) {
    const listShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, currentY, 630, 250);
    const textRange = listShape.getText();
    textRange.setText(data.bullets.join('\\n'));
    textRange.getTextStyle().setFontSize(16).setForegroundColor('#4A5568').setFontFamily(THEME.fonts.body);
    textRange.getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
  }
}

/**
 * RENDERER: Steps
 */
function renderStepsSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.dark);
  
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 40, 40, 650, 60);
  titleShape.getText().setText(data.title)
    .getTextStyle()
    .setForegroundColor(THEME.colors.white)
    .setFontSize(36)
    .setFontFamily(THEME.fonts.heading)
    .setBold(true);
      
  const startY = 125;
  const cardW = 640;
  const cardH = 80;
  const gap = 20;

  data.steps.forEach((step, i) => {
    const y = startY + (i * (cardH + gap));
    
    // Draw Card with Shadow
    drawCard(slide, 40, y, cardW, cardH, THEME.colors.card, THEME.colors.border);
    
    // Number Bubble
    const bubble = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, 60, y + 20, 40, 40);
    bubble.getFill().setSolidFill(THEME.colors.primary);
    bubble.getBorder().setTransparent();
    const numText = bubble.getText();
    numText.setText((i + 1).toString());
    numText.getTextStyle().setForegroundColor(THEME.colors.white).setBold(true).setFontSize(20).setFontFamily(THEME.fonts.heading);
    numText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    
    // Content
    const tShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 115, y + 15, 540, 30);
    tShape.getText().setText(step.title)
      .getTextStyle().setForegroundColor(THEME.colors.white).setBold(true).setFontSize(18).setFontFamily(THEME.fonts.heading);
      
    const dShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 115, y + 42, 540, 30);
    dShape.getText().setText(step.description)
      .getTextStyle().setForegroundColor(THEME.colors.gray).setFontSize(13).setFontFamily(THEME.fonts.body);
  });
}

/**
 * RENDERER: Stats
 */
function renderStatsSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.dark);
  
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 40, 40, 650, 60);
  titleShape.getText().setText(data.title || 'Impact Metrics')
    .getTextStyle().setForegroundColor(THEME.colors.white).setFontSize(36).setBold(true).setFontFamily(THEME.fonts.heading);

  const stats = data.stats;
  const cardW = 300;
  const cardH = 140;
  const startX = 40;
  const startY = 130;

  stats.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + (col * (cardW + 20));
    const y = startY + (row * (cardH + 20));
    
    drawCard(slide, x, y, cardW, cardH, THEME.colors.card, THEME.colors.border);
    
    const valStr = (stat.prefix || '') + stat.value + (stat.suffix || '');
    const valShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, x + 20, y + 20, cardW - 40, 60);
    valShape.getText().setText(valStr)
      .getTextStyle().setFontSize(48).setBold(true).setForegroundColor(THEME.colors.primary).setFontFamily(THEME.fonts.heading);
      
    const lblShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, x + 20, y + 80, cardW - 40, 40);
    lblShape.getText().setText(stat.label.toUpperCase())
      .getTextStyle().setForegroundColor(THEME.colors.textLight).setFontSize(12).setBold(true).setFontFamily(THEME.fonts.body);
  });
}

/**
 * RENDERER: Comparison (New!)
 */
function renderComparisonSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.white);
  
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 40, 30, 650, 50);
  titleShape.getText().setText(data.title || 'Comparison')
    .getTextStyle().setForegroundColor(THEME.colors.textDark).setFontSize(32).setBold(true).setFontFamily(THEME.fonts.heading);

  const cardW = 320;
  const cardH = 280;
  const y = 100;
  
  // LEFT (Before/Old) - Gray Theme
  drawCard(slide, 40, y, cardW, cardH, '#F7FAFC', '#E2E8F0');
  
  const lLabel = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 60, y + 20, 280, 40);
  lLabel.getText().setText((data.leftLabel || 'BEFORE').toUpperCase())
    .getTextStyle().setForegroundColor(THEME.colors.gray).setBold(true).setFontSize(14).setFontFamily(THEME.fonts.heading);
    
  if (data.leftItems) {
    const lText = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 60, y + 60, 280, 200);
    lText.getText().setText(data.leftItems.join('\\n\\n'));
    lText.getText().getTextStyle().setForegroundColor('#718096').setFontSize(14).setFontFamily(THEME.fonts.body);
  }

  // ARROW (Center)
  const arrow = slide.insertShape(SlidesApp.ShapeType.RIGHT_ARROW, 375, y + 120, 40, 40);
  arrow.getFill().setSolidFill(THEME.colors.primary);
  arrow.getBorder().setTransparent();

  // RIGHT (After/New) - Success Theme
  drawCard(slide, 430, y, cardW, cardH, '#F0FFF4', '#9AE6B4');
  
  const rLabel = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 450, y + 20, 280, 40);
  rLabel.getText().setText((data.rightLabel || 'AFTER').toUpperCase())
    .getTextStyle().setForegroundColor(THEME.colors.success).setBold(true).setFontSize(14).setFontFamily(THEME.fonts.heading);
    
  if (data.rightItems) {
    const rText = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 450, y + 60, 280, 200);
    rText.getText().setText(data.rightItems.join('\\n\\n'));
    rText.getText().getTextStyle().setForegroundColor('#2F855A').setFontSize(14).setFontFamily(THEME.fonts.body);
  }
}

/**
 * RENDERER: Timeline (New!)
 */
function renderTimelineSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.white);
  
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 40, 30, 650, 50);
  titleShape.getText().setText(data.title || 'Timeline')
    .getTextStyle().setForegroundColor(THEME.colors.textDark).setFontSize(32).setBold(true).setFontFamily(THEME.fonts.heading);

  const nodes = data.nodes || [];
  if (nodes.length === 0) return;

  const startX = 60;
  const startY = 200;
  const gap = 160;
  
  // Draw connecting line
  const lineLength = (nodes.length - 1) * gap;
  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, startX, startY + 9, lineLength, 4);
  line.getFill().setSolidFill('#E2E8F0');
  line.getBorder().setTransparent();

  nodes.forEach((node, i) => {
    const x = startX + (i * gap);
    
    // Dot
    const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x - 10, startY, 24, 24);
    dot.getFill().setSolidFill(THEME.colors.primary);
    dot.getBorder().getLineFill().setSolidFill(THEME.colors.white);
    dot.getBorder().setWeight(3);
    
    // Date (Top)
    const dateText = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, x - 50, startY - 40, 100, 30);
    dateText.getText().setText(node.date)
      .getTextStyle().setForegroundColor(THEME.colors.primary).setBold(true).setFontSize(14).setFontFamily(THEME.fonts.heading);
    dateText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    
    // Title (Bottom)
    const titleText = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, x - 60, startY + 30, 120, 30);
    titleText.getText().setText(node.title)
      .getTextStyle().setForegroundColor(THEME.colors.textDark).setBold(true).setFontSize(14).setFontFamily(THEME.fonts.heading);
    titleText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
      
    // Desc
    if (node.description) {
      const descText = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, x - 60, startY + 55, 120, 60);
      descText.getText().setText(node.description)
        .getTextStyle().setForegroundColor(THEME.colors.gray).setFontSize(11).setFontFamily(THEME.fonts.body);
      descText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  });
}

/**
 * RENDERER: Q&A (New!)
 */
function renderQASlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.primary);
  
  const qText = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 0, 150, 720, 100);
  qText.getText().setText("Q&A")
    .getTextStyle().setForegroundColor(THEME.colors.white).setFontSize(120).setBold(true).setFontFamily(THEME.fonts.heading);
  qText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  
  if (data.subtitle) {
    const sub = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 0, 260, 720, 50);
    sub.getText().setText(data.subtitle)
      .getTextStyle().setForegroundColor(THEME.colors.textLight).setFontSize(24).setFontFamily(THEME.fonts.body);
    sub.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  }
}

/**
 * RENDERER: Closing (New!)
 */
function renderClosingSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.dark);
  
  const tagText = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 0, 160, 720, 60);
  tagText.getText().setText(data.tagline || "Thank You")
    .getTextStyle().setForegroundColor(THEME.colors.white).setFontSize(48).setBold(true).setFontFamily(THEME.fonts.heading);
  tagText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  
  let y = 240;
  if (data.contactEmail) {
    const email = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 0, y, 720, 40);
    email.getText().setText(data.contactEmail)
      .getTextStyle().setForegroundColor(THEME.colors.primary).setFontSize(20).setFontFamily(THEME.fonts.body);
    email.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    y += 50;
  }
}

/**
 * RENDERER: Quote
 */
function renderQuoteSlide(slide, data) {
  slide.getBackground().setSolidFill('#F8FAFC');
  
  const qMark = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 40, 50, 150, 150);
  qMark.getText().setText('“').getTextStyle().setFontSize(160).setForegroundColor('#CBD5E0').setBold(true);
  
  const qShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 80, 140, 560, 200);
  qShape.getText().setText(data.quote)
    .getTextStyle().setFontSize(32).setItalic(true).setForegroundColor(THEME.colors.textDark).setFontFamily(THEME.fonts.heading);
      
  const authorFull = data.author + (data.authorTitle ? " — " + data.authorTitle : "");
  const aShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 80, 320, 560, 40);
  aShape.getText().setText(authorFull)
    .getTextStyle().setBold(true).setForegroundColor(THEME.colors.primary).setFontSize(18).setFontFamily(THEME.fonts.body);
}

function renderDividerSlide(slide, data) {
  slide.getBackground().setSolidFill(THEME.colors.primary);
  const shape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 60, 170, 600, 100);
  shape.getText().setText(data.title)
    .getTextStyle().setForegroundColor(THEME.colors.white).setFontSize(60).setBold(true).setFontFamily(THEME.fonts.heading);
}

function renderTwoColumnSlide(slide, data) {
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 40, 35, 650, 60);
  titleShape.getText().setText(data.title)
    .getTextStyle().setForegroundColor(THEME.colors.primary).setFontSize(36).setBold(true).setFontFamily(THEME.fonts.heading);

  function renderCol(colData, xPos) {
    drawCard(slide, xPos, 115, 325, 265, '#F7FAFC', '#E2E8F0');

    const tShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, xPos + 25, 140, 275, 45);
    tShape.getText().setText(colData.title).getTextStyle().setBold(true).setFontSize(22).setForegroundColor(THEME.colors.textDark).setFontFamily(THEME.fonts.heading);
      
    const bShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, xPos + 25, 190, 275, 160);
    bShape.getText().setText(colData.body).getTextStyle().setFontSize(15).setForegroundColor('#4A5568').setFontFamily(THEME.fonts.body);
  }
  
  renderCol(data.left, 40);
  renderCol(data.right, 385);
}

function renderGenericSlide(slide, data) {
  slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, 50, 150, 600, 100).getText().setText("Slide: " + data.type).getTextStyle().setFontSize(24);
}
`;

// 4. Write output
if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
}

fs.writeFileSync(OUTPUT_PATH, appsScriptTemplate(slidesData));

console.log('---------------------------------------------------');
console.log('✅ Google Apps Script (PRO) Generated!');
console.log('File: ' + OUTPUT_PATH);
console.log('---------------------------------------------------');
