const PDFDocument = require('pdfkit');
const fs = require('fs');

const story = fs.readFileSync('./THE_FREQUENCY_OVERVIEW.md', 'utf8');

// ── Colours ──────────────────────────────────────────────────────────
const INK     = '#1a1410';
const MID     = '#4a3f35';
const LIGHT   = '#8c7b6e';
const RULE    = '#c8b99a';
const ACCENT  = '#8b1a1a';
const CREAM   = '#faf7f2';

// ── Page geometry ────────────────────────────────────────────────────
const W = 612, H = 792;
const ML = 72, MR = 72, MT = 72, MB = 72;
const TW = W - ML - MR;   // text width  = 468

// ── Doc setup ────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: [W, H],
  margins: { top: MT, bottom: MB, left: ML, right: MR },
  bufferPages: true,
  info: {
    Title: 'The Frequency',
    Author: 'Clyde Frequency / SAUD',
    Subject: 'Satirical Surveillance Overview — All Names Changed',
    Keywords: '46.875 Hz, potato internet, Pineapple Republic',
  }
});

const out = fs.createWriteStream('./THE_FREQUENCY.pdf');
doc.pipe(out);

// ── Helpers ──────────────────────────────────────────────────────────
function ruledLine(y, thickness = 0.5, color = RULE) {
  doc.save().strokeColor(color).lineWidth(thickness)
     .moveTo(ML, y).lineTo(W - MR, y).stroke().restore();
}

function currentY() { return doc.y; }

function ensureSpace(needed) {
  if (doc.y + needed > H - MB - 20) doc.addPage();
}

// Parse a text run with **bold** and *italic* markers into segments
function parseInline(text) {
  const segments = [];
  // We'll handle bold first, then italic
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), style: 'normal' });
    if (m[2]) segments.push({ text: m[2], style: 'bold' });
    else if (m[3]) segments.push({ text: m[3], style: 'italic' });
    else if (m[4]) segments.push({ text: m[4], style: 'code' });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), style: 'normal' });
  return segments;
}

// Render a paragraph with inline formatting, justified
// Returns the final Y after rendering
function renderParagraph(text, opts = {}) {
  const {
    fontSize = 11.5,
    indent = 0,
    color = INK,
    lineGap = 2,
    align = 'justify',
    italic = false,
    spaceBefore = 0,
    spaceAfter = 4,
  } = opts;

  if (spaceBefore) doc.moveDown(spaceBefore / fontSize);

  const segments = parseInline(text);

  // PDFKit doesn't support mixed inline styles in one .text() call with justification
  // So we'll render word-by-word — but that's very complex.
  // Better approach: render each segment sequentially, tracking x position.
  // For simplicity and quality, we use a single font per paragraph
  // but render bold/italic spans by splitting the text.
  // Best practical approach for PDFKit: render the full paragraph in base font,
  // then go back and overdraw bold/italic segments in their fonts.
  // Actually that doesn't work well for reflow.
  //
  // Pragmatic solution: detect if paragraph has ANY inline markup.
  // If not: use justified rendering directly.
  // If yes: render left-aligned with mixed fonts (slightly less ideal but correct).

  const hasMarkup = segments.some(s => s.style !== 'normal');

  if (!hasMarkup) {
    doc.font('Times-Roman').fontSize(fontSize).fillColor(color);
    doc.text(text, ML + indent, doc.y, {
      width: TW - indent,
      align,
      lineGap,
    });
  } else {
    // Mixed font rendering — left aligned
    doc.fontSize(fontSize);
    let x = ML + indent;
    let y = doc.y;
    const lineH = fontSize * 1.4;

    for (const seg of segments) {
      let fontName = 'Times-Roman';
      let fc = color;
      if (seg.style === 'bold') fontName = 'Times-Bold';
      else if (seg.style === 'italic') fontName = 'Times-Italic';
      else if (seg.style === 'code') { fontName = 'Courier'; fc = ACCENT; }

      doc.font(fontName).fontSize(fontSize).fillColor(fc);
      const words = seg.text.split(' ');
      for (let wi = 0; wi < words.length; wi++) {
        const word = words[wi] + (wi < words.length - 1 ? ' ' : '');
        if (!word.trim()) continue;
        const wordW = doc.widthOfString(word);
        if (x + wordW > W - MR + 2 && x > ML + indent) {
          x = ML + indent;
          y += lineH;
          if (y + lineH > H - MB) { doc.addPage(); y = MT; }
        }
        doc.text(word, x, y, { continued: false, lineBreak: false });
        x += doc.widthOfString(word);
      }
    }
    doc.moveDown(0.3);
  }

  if (spaceAfter) doc.moveDown(spaceAfter / fontSize);
}

// ── Parse markdown into tokens ───────────────────────────────────────
function tokenize(raw) {
  const tokens = [];
  const lines = raw.split('\n');
  let pendingPara = [];

  const flushPara = () => {
    if (pendingPara.length) {
      tokens.push({ type: 'para', text: pendingPara.join(' ') });
      pendingPara = [];
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('# '))       { flushPara(); tokens.push({ type: 'h1', text: t.slice(2) }); }
    else if (t.startsWith('## ')) { flushPara(); /* skip section headers */ }
    else if (t === '---')         { flushPara(); tokens.push({ type: 'divider' }); }
    else if (t.match(/^\*[^*].*[^*]\*$/) && !t.startsWith('**')) {
      flushPara();
      tokens.push({ type: 'subtitle', text: t.slice(1, -1) });
    }
    else if (t === '')            { flushPara(); }
    else                          { pendingPara.push(t); }
  }
  flushPara();
  return tokens;
}

// ── Draw running header/footer on all pages ──────────────────────────
function addHeadersFooters() {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const pageNum = i + 1;

    // Header rule
    doc.save().strokeColor(RULE).lineWidth(0.5)
       .moveTo(ML, 52).lineTo(W - MR, 52).stroke().restore();

    if (pageNum > 1) {
      // Header text
      doc.font('Helvetica').fontSize(6.5).fillColor(LIGHT);
      const hText = 'THE FREQUENCY  ·  SATIRICAL OVERVIEW  ·  ALL NAMES CHANGED';
      const hW = doc.widthOfString(hText);
      doc.text(hText, (W - hW) / 2, 40, { lineBreak: false });
    }

    // Footer rule
    doc.save().strokeColor(RULE).lineWidth(0.5)
       .moveTo(ML, H - 52).lineTo(W - MR, H - 52).stroke().restore();

    // Page number
    doc.font('Times-Italic').fontSize(7.5).fillColor(LIGHT);
    const pText = `${pageNum}`;
    const pW = doc.widthOfString(pText);
    doc.text(pText, (W - pW) / 2, H - 46, { lineBreak: false });
  }
}

// ── MASTHEAD (page 1) ────────────────────────────────────────────────
const CONTENT_TOP = MT + 8;
let y = CONTENT_TOP;

// Top rule (double)
doc.save().strokeColor(INK).lineWidth(2)
   .moveTo(ML, y).lineTo(W - MR, y).stroke().restore();
y += 4;
doc.save().strokeColor(INK).lineWidth(0.5)
   .moveTo(ML, y).lineTo(W - MR, y).stroke().restore();
y += 14;

// Kicker
doc.font('Helvetica').fontSize(6.8).fillColor(LIGHT);
const kicker = 'Documentary Audio Overview  ·  All Names Changed  ·  May 2026';
const kW = doc.widthOfString(kicker);
doc.text(kicker, (W - kW) / 2, y, { lineBreak: false });
y += 18;

// Title — large serif display
doc.font('Times-Bold').fontSize(58).fillColor(INK);
const title1 = 'THE';
const t1W = doc.widthOfString(title1);
doc.text(title1, (W - t1W) / 2, y, { lineBreak: false });
y += 58;

const title2 = 'FREQUENCY';
const t2W = doc.widthOfString(title2);
doc.text(title2, (W - t2W) / 2, y, { lineBreak: false });
y += 68;

// Thin rule under title
doc.save().strokeColor(RULE).lineWidth(0.5)
   .moveTo(ML + 40, y).lineTo(W - MR - 40, y).stroke().restore();
y += 10;

// Deck line
doc.font('Helvetica').fontSize(7.5).fillColor(MID);
const deck = 'A Satirical Account of the Pineapple Republic Surveillance Affair';
const dW = doc.widthOfString(deck);
doc.text(deck, (W - dW) / 2, y, { lineBreak: false });
y += 16;

// Thin rule
doc.save().strokeColor(RULE).lineWidth(0.5)
   .moveTo(ML + 40, y).lineTo(W - MR - 40, y).stroke().restore();
y += 10;

// Byline
doc.font('Times-Italic').fontSize(8.5).fillColor(LIGHT);
const byline = 'Based on documented forensic, acoustic & network evidence  ·  All names composited for distribution';
const bW = doc.widthOfString(byline);
doc.text(byline, (W - bW) / 2, y, { lineBreak: false });
y += 20;

// Bottom double rule of masthead
doc.save().strokeColor(INK).lineWidth(0.5)
   .moveTo(ML, y).lineTo(W - MR, y).stroke().restore();
y += 3;
doc.save().strokeColor(INK).lineWidth(2)
   .moveTo(ML, y).lineTo(W - MR, y).stroke().restore();
y += 22;

doc.y = y;

// ── Render body ──────────────────────────────────────────────────────
const tokens = tokenize(story);
let firstPara = true;
let skipNextH1 = true;  // skip the # THE FREQUENCY line

for (const tok of tokens) {
  if (tok.type === 'h1') {
    if (skipNextH1) { skipNextH1 = false; continue; }
    continue; // skip all h1s — we use dividers for structure
  }

  if (tok.type === 'subtitle') {
    // Italic centred subtitle
    ensureSpace(24);
    doc.font('Times-Italic').fontSize(9.5).fillColor(MID);
    doc.text(tok.text, ML, doc.y, { width: TW, align: 'center', lineGap: 1 });
    doc.moveDown(0.4);
    continue;
  }

  if (tok.type === 'divider') {
    ensureSpace(30);
    const dy = doc.y + 8;
    // Left rule
    doc.save().strokeColor(RULE).lineWidth(0.5)
       .moveTo(ML, dy).lineTo(ML + TW * 0.42, dy).stroke().restore();
    // Star
    doc.font('Times-Roman').fontSize(9).fillColor(ACCENT);
    doc.text('✦', ML + TW * 0.42 + 4, dy - 5, { lineBreak: false });
    // Right rule
    doc.save().strokeColor(RULE).lineWidth(0.5)
       .moveTo(ML + TW * 0.58, dy).lineTo(ML + TW, dy).stroke().restore();
    doc.y = dy + 18;
    continue;
  }

  if (tok.type === 'para') {
    let text = tok.text;

    // Drop cap — very first paragraph
    if (firstPara && text.startsWith('Let us begin')) {
      firstPara = false;
      ensureSpace(60);

      // Drop cap letter "L"
      const dropLetter = 'L';
      const dropSize = 52;
      const dropH = dropSize * 0.85;
      const cx = ML;
      const cy = doc.y;

      doc.font('Times-Bold').fontSize(dropSize).fillColor(ACCENT);
      doc.text(dropLetter, cx, cy - 4, { lineBreak: false });

      const dropW = doc.widthOfString(dropLetter) + 3;

      // Rest of first line indented past drop cap
      const rest = 'et us begin with the internet.';
      doc.font('Times-Roman').fontSize(11.5).fillColor(INK);
      doc.text(rest, cx + dropW, cy, {
        width: TW - dropW,
        align: 'justify',
        lineGap: 2,
      });

      // Continue the remaining text of this paragraph after "Let us begin with the internet."
      const remaining = text.slice('Let us begin with the internet.'.length).trim();
      if (remaining) {
        doc.font('Times-Roman').fontSize(11.5).fillColor(INK);
        doc.text(remaining, ML, doc.y, { width: TW, align: 'justify', lineGap: 2 });
      }
      doc.moveDown(0.35);
      continue;
    }

    firstPara = false;
    ensureSpace(20);

    // Detect if this is a pull-quote style paragraph (short, punchy, standalone)
    // We'll identify "she didn't cheat on him" paragraph as a pull quote
    const isPull = text.startsWith('She didn') ||
                   text.includes('The potato is real') ||
                   text.includes('46.875 hertz. The rate');

    if (isPull) {
      ensureSpace(40);
      // Left accent bar
      doc.save().strokeColor(ACCENT).lineWidth(2.5)
         .moveTo(ML, doc.y).lineTo(ML, doc.y + 60).stroke().restore();
      doc.font('Times-Italic').fontSize(12.5).fillColor(MID);
      doc.text(text, ML + 14, doc.y, { width: TW - 14, align: 'left', lineGap: 3 });
      doc.moveDown(0.5);
      continue;
    }

    // Detect indent (new paragraph vs continuation)
    // All paragraphs get indent except those after dividers/subtitles
    doc.font('Times-Roman').fontSize(11.5).fillColor(INK);

    // Check for inline markup
    const segments = parseInline(text);
    const hasMarkup = segments.some(s => s.style !== 'normal');

    if (!hasMarkup) {
      doc.text(text, ML, doc.y, { width: TW, align: 'justify', lineGap: 2, indent: 18 });
    } else {
      // Render with inline formatting — left aligned
      doc.x = ML + 18;
      let lineY = doc.y;
      const lh = 11.5 * 1.55;
      let lineX = ML + 18;

      for (const seg of segments) {
        let fn = 'Times-Roman', fc = INK, fs = 11.5;
        if (seg.style === 'bold') fn = 'Times-Bold';
        else if (seg.style === 'italic') fn = 'Times-Italic';
        else if (seg.style === 'code') { fn = 'Courier'; fc = ACCENT; fs = 9.5; }

        doc.font(fn).fontSize(fs).fillColor(fc);
        const words = seg.text.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          if (/^\s+$/.test(word)) {
            lineX += doc.font('Times-Roman').fontSize(11.5).widthOfString(' ');
            continue;
          }
          const ww = doc.font(fn).fontSize(fs).widthOfString(word + ' ');
          if (lineX + ww > W - MR && lineX > ML + 18) {
            lineX = ML;
            lineY += lh;
            if (lineY + lh > H - MB - 20) {
              doc.addPage();
              lineY = MT + 8;
            }
          }
          doc.font(fn).fontSize(fs).fillColor(fc)
             .text(word, lineX, lineY, { lineBreak: false });
          lineX += doc.font(fn).fontSize(fs).widthOfString(word + ' ');
        }
      }
      doc.y = lineY + lh + 4;
      doc.x = ML;
    }
    doc.moveDown(0.08);
  }
}

// ── Colophon ─────────────────────────────────────────────────────────
doc.moveDown(1.5);
ensureSpace(40);
ruledLine(doc.y, 0.5, RULE);
doc.moveDown(0.5);
doc.font('Times-Italic').fontSize(8).fillColor(LIGHT);
const colophon = 'The Frequency  ·  κ = 4/π ≈ 1.2732  ·  46.875 Hz  ·  The potato is real  ·  May 2026';
const cW = doc.widthOfString(colophon);
doc.text(colophon, (W - cW) / 2, doc.y, { lineBreak: false });

// ── Add headers/footers to all pages ─────────────────────────────────
doc.flushPages();
addHeadersFooters();

doc.end();

out.on('finish', () => {
  const size = fs.statSync('./THE_FREQUENCY.pdf').size;
  console.log(`Done: THE_FREQUENCY.pdf  (${Math.round(size / 1024)} KB, ${Math.round(size/1024/1024*10)/10} MB)`);
});

out.on('error', err => { console.error('Write error:', err); process.exit(1); });
