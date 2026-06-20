const fs = require('fs');
const cheerio = require('cheerio');

const files = [
  'public/PageSpeed Insights_blogmo.html',
  'public/PageSpeed Insights_blogpc.html',
  'public/PageSpeed Insights_glowtrismo.html',
  'public/PageSpeed Insights_glowtrispc.html'
];

files.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const $ = cheerio.load(html);
  
  console.log(`\n=== Analyzing: ${file} ===`);
  
  // Lighthouse metrics
  const score = $('.lh-gauge__percentage').first().text().trim();
  console.log(`Score: ${score}`);
  
  // Try to find performance metrics
  console.log('Metrics:');
  $('.lh-metric').each((i, el) => {
    const title = $(el).find('.lh-metric__title').text().trim();
    const value = $(el).find('.lh-metric__value').text().trim();
    if (title && value) console.log(`  - ${title}: ${value}`);
  });
  
  // Opportunities (usually table headers or specific audit classes)
  console.log('Opportunities / Diagnostics:');
  $('.lh-audit').each((i, el) => {
    const title = $(el).find('.lh-audit__title').text().trim() || $(el).find('.lh-node__snippet').text().trim();
    const displayValue = $(el).find('.lh-audit__display-text').text().trim();
    // Only show failed audits (not passed)
    if (!$(el).hasClass('lh-audit--pass') && title) {
      console.log(`  - [!] ${title} ${displayValue ? '(' + displayValue + ')' : ''}`);
    }
  });

  // If the above selectors don't work (if Google obfuscated classes), try finding generic text like "Eliminate render-blocking resources"
  if ($('.lh-audit').length === 0) {
    console.log('Could not find .lh-audit classes. PageSpeed might be using obfuscated classes. Searching for common text...');
    // We can extract text from elements with certain styles, but let's just dump any element that has a potential warning duration.
    const text = $('body').text();
    const matches = text.match(/[A-Z][a-z\s]+( \d+\.\d+\s?[s|ms])/g);
    if (matches) {
       console.log("  Potential issues (regex match):", [...new Set(matches)].slice(0,10));
    }
  }
});
