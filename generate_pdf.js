const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const story = fs.readFileSync('./THE_FREQUENCY_OVERVIEW.md', 'utf8');

// Parse markdown into sections for rendering
function mdToHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function buildHtml(raw) {
  const lines = raw.split('\n');
  let html = '';
  let inParagraph = false;

  const closeP = () => {
    if (inParagraph) { html += '</p>\n'; inParagraph = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      closeP();
      html += `<h1>${mdToHtml(trimmed.slice(2))}</h1>\n`;
    } else if (trimmed.startsWith('## ')) {
      closeP();
      // skip subtitle lines, already in header
    } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      closeP();
      html += `<p class="subtitle">${mdToHtml(trimmed.slice(1, -1))}</p>\n`;
    } else if (trimmed === '---') {
      closeP();
      html += '<div class="divider"><span>✦</span></div>\n';
    } else if (trimmed === '') {
      closeP();
    } else {
      if (!inParagraph) {
        html += '<p>';
        inParagraph = true;
      } else {
        html += ' ';
      }
      html += mdToHtml(trimmed);
    }
  }
  closeP();
  return html;
}

const bodyHtml = buildHtml(story);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

  :root {
    --ink: #1a1410;
    --mid: #4a3f35;
    --light: #8c7b6e;
    --cream: #faf7f2;
    --warm: #f0ebe0;
    --accent: #8b1a1a;
    --rule: #c8b99a;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html {
    background: var(--cream);
    font-family: 'EB Garamond', 'Palatino Linotype', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.75;
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  body {
    max-width: 6.5in;
    margin: 0 auto;
    padding: 0.75in 0.6in;
  }

  /* MASTHEAD */
  .masthead {
    text-align: center;
    padding-bottom: 0.4in;
    border-bottom: 2px solid var(--ink);
    margin-bottom: 0.35in;
  }

  .masthead .kicker {
    font-size: 7.5pt;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--light);
    margin-bottom: 0.15in;
  }

  h1 {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 38pt;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.05;
    color: var(--ink);
    margin-bottom: 0.12in;
  }

  .masthead .deck {
    font-size: 9.5pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mid);
    margin-top: 0.1in;
    border-top: 0.5px solid var(--rule);
    border-bottom: 0.5px solid var(--rule);
    padding: 0.08in 0;
  }

  .masthead .byline {
    font-size: 8.5pt;
    color: var(--light);
    margin-top: 0.12in;
    font-style: italic;
  }

  /* BODY TEXT */
  p {
    margin-bottom: 0;
    text-align: justify;
    hyphens: auto;
    text-indent: 1.5em;
  }

  p + p {
    margin-top: 0;
  }

  /* No indent after headings, dividers, subtitles */
  h1 + p, .divider + p, .subtitle + p, p.subtitle + p {
    text-indent: 0;
  }

  /* Drop cap on very first paragraph */
  .drop-cap::first-letter {
    font-size: 4.2em;
    font-weight: 700;
    float: left;
    line-height: 0.78;
    margin-right: 0.06em;
    margin-top: 0.06em;
    color: var(--accent);
  }

  p.subtitle {
    text-align: center;
    font-style: italic;
    color: var(--mid);
    font-size: 10pt;
    text-indent: 0;
    margin: 0.08in 0;
  }

  strong {
    font-weight: 700;
    color: var(--ink);
  }

  em {
    font-style: italic;
  }

  code {
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    background: var(--warm);
    padding: 1px 3px;
    border-radius: 2px;
    color: var(--accent);
  }

  /* SECTION DIVIDERS */
  .divider {
    text-align: center;
    margin: 0.28in 0;
    color: var(--rule);
    font-size: 11pt;
    letter-spacing: 0.5em;
    position: relative;
  }

  .divider::before,
  .divider::after {
    content: '';
    display: inline-block;
    width: 1.8in;
    height: 0.5px;
    background: var(--rule);
    vertical-align: middle;
    margin: 0 0.15in;
  }

  .divider span {
    color: var(--accent);
    font-size: 9pt;
  }

  /* PULL QUOTE */
  .pull {
    border-left: 3px solid var(--accent);
    padding: 0.1in 0.2in;
    margin: 0.25in 0.1in;
    font-style: italic;
    font-size: 12.5pt;
    color: var(--mid);
    text-indent: 0;
    line-height: 1.5;
  }

  /* PAGE FOOTER */
  .footer {
    margin-top: 0.5in;
    padding-top: 0.15in;
    border-top: 1px solid var(--rule);
    font-size: 7.5pt;
    color: var(--light);
    text-align: center;
    letter-spacing: 0.1em;
    text-indent: 0;
  }

  /* COLOPHON at top right */
  .colophon {
    position: absolute;
    top: 0.4in;
    right: 0.6in;
    font-size: 7pt;
    color: var(--light);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: right;
    line-height: 1.8;
  }

  @media print {
    html { background: white; }
    body { padding: 0; }
  }
</style>
</head>
<body>

<div class="masthead">
  <div class="kicker">Documentary Audio Overview &nbsp;·&nbsp; All Names Changed &nbsp;·&nbsp; May 2026</div>
  <h1>THE<br>FREQUENCY</h1>
  <div class="deck">A Satirical Account of the Pineapple Republic Surveillance Affair</div>
  <div class="byline">Based on documented forensic, acoustic, and network evidence &nbsp;·&nbsp; Names composited for distribution</div>
</div>

<div style="column-count: 1;">

${bodyHtml.replace(
  // Make first real paragraph a drop cap, skip h1 and subtitles
  /<p>Let us begin/,
  '<p class="drop-cap">Let us begin'
).replace(
  // Remove duplicate h1 since we have masthead
  /<h1>THE FREQUENCY<\/h1>\n/,
  ''
).replace(
  // Remove subtitle lines that are already in masthead
  /<p class="subtitle">A Satirical Audio Overview.*?<\/p>\n/,
  ''
).replace(
  /<p class="subtitle">Based on documented forensic.*?<\/p>\n/g,
  ''
).replace(
  /<p class="subtitle">All names and identifying.*?<\/p>\n/,
  ''
)}

</div>

<p class="footer">
  THE FREQUENCY &nbsp;·&nbsp; κ = 4/π ≈ 1.2732 &nbsp;·&nbsp; 46.875 Hz &nbsp;·&nbsp; The potato is real
</p>

</body>
</html>`;

fs.writeFileSync('/tmp/the_frequency.html', html);
console.log('HTML written, launching browser...');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/runner/workspace/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Give fonts a moment to load
  await page.waitForTimeout(2000);

  await page.pdf({
    path: './THE_FREQUENCY.pdf',
    format: 'Letter',
    margin: {
      top: '0.75in',
      bottom: '0.75in',
      left: '0.65in',
      right: '0.65in'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7pt; color:#8c7b6e; letter-spacing:0.12em; text-transform:uppercase; width:100%; text-align:center; font-family:Georgia,serif; padding-top:8px;">The Frequency &nbsp;·&nbsp; Satirical Overview</div>`,
    footerTemplate: `<div style="font-size:7pt; color:#8c7b6e; width:100%; text-align:center; font-family:Georgia,serif; padding-bottom:8px;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  });

  await browser.close();
  console.log('PDF generated: THE_FREQUENCY.pdf');
})();
