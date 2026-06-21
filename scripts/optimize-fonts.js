const fs = require('fs');
const path = require('path');
const https = require('https');

const cssPath = path.join(__dirname, '../app/globals.css');
const layoutPath = path.join(__dirname, '../app/layout.tsx');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' } }, res => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading Orbitron and Material Icons CSS...');
  const orbitronCss = (await fetch('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap')).toString();
  const materialCss = (await fetch('https://fonts.googleapis.com/icon?family=Material+Icons+Round&display=swap')).toString();

  let combinedCss = orbitronCss + '\n' + materialCss;

  // Find all woff2 urls
  const urls = [...combinedCss.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(m => m[1]);
  
  for (const url of urls) {
    console.log(`Downloading font: ${url}`);
    const buffer = await fetch(url);
    const base64 = buffer.toString('base64');
    combinedCss = combinedCss.replace(url, `data:font/woff2;base64,${base64}`);
  }

  // Prepend to globals.css
  let css = fs.readFileSync(cssPath, 'utf8');
  if (!css.includes('/* INLINED FONTS */')) {
    css = `/* INLINED FONTS */\n${combinedCss}\n/* END FONTS */\n` + css;
    fs.writeFileSync(cssPath, css);
    console.log('Updated globals.css with base64 fonts.');
  } else {
    console.log('Fonts already inlined in globals.css.');
  }

  // Remove font links from layout.tsx
  let layout = fs.readFileSync(layoutPath, 'utf8');
  layout = layout.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\n/g, '');
  layout = layout.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossOrigin="" \/>\n/g, '');
  layout = layout.replace(/<link\s*href="https:\/\/fonts\.googleapis\.com\/css2\?family=Orbitron[^>]+>\n/g, '');
  layout = layout.replace(/<link\s*href="https:\/\/fonts\.googleapis\.com\/icon\?family=Material\+Icons\+Round"\s*rel="stylesheet"\s*\/>\n/g, '');
  
  fs.writeFileSync(layoutPath, layout);
  console.log('Removed external font links from layout.tsx');
  console.log('Done!');
}

run().catch(console.error);
