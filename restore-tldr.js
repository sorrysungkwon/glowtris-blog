const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getOldContent(filePath) {
  try {
    return execSync(`git show 9299886c37:${filePath}`, { encoding: 'utf8' });
  } catch {
    return null;
  }
}

function processDir(dirPath, isKo) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.mdx'));
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), path.join(dirPath, file));
    const oldContent = getOldContent(relativePath);
    if (!oldContent) continue;

    // Extract TLDR from old content
    let tldrMatch;
    if (isKo) {
      tldrMatch = oldContent.match(/^>\s*\*\*(?:TL;DR|요약):?\*\*\s*(.+?)(?:\n\n|\n$|$)/mi) || oldContent.match(/^>\s*\*\*(?:TL;DR|요약):?\s*\*\*\s*(.+?)(?:\n\n|\n$|$)/mi) || oldContent.match(/^>\s*(?:TL;DR|요약):?\s*(.+?)(?:\n\n|\n$|$)/mi);
    } else {
      tldrMatch = oldContent.match(/^>\s*\*\*(?:TL;DR|Summary):?\*\*\s*(.+?)(?:\n\n|\n$|$)/mi) || oldContent.match(/^>\s*\*\*(?:TL;DR|Summary):?\s*\*\*\s*(.+?)(?:\n\n|\n$|$)/mi) || oldContent.match(/^>\s*(?:TL;DR|Summary):?\s*(.+?)(?:\n\n|\n$|$)/mi);
    }

    if (tldrMatch) {
      const tldrText = tldrMatch[1].trim();
      
      // Now update current file frontmatter
      const currentContent = fs.readFileSync(relativePath, 'utf8');
      const fmRegex = /^---\n([\s\S]*?)\n---/;
      const match = currentContent.match(fmRegex);
      if (match) {
        let fm = match[1];
        const fieldName = isKo ? 'tldr_ko' : 'tldr';
        
        // Remove existing tldr/tldr_ko if any
        const re = new RegExp(`^${fieldName}:[ \\t]*(?:"((?:[^"\\\\]|\\\\[\\s\\S])*)"|([^\\n]*))[ \\t]*(\\r?\\n|$)`, 'm');
        fm = fm.replace(re, '');
        
        // Append new
        fm = fm.trim() + `\n${fieldName}: "${tldrText.replace(/"/g, '\\"')}"`;
        
        const newContent = currentContent.replace(fmRegex, `---\n${fm}\n---`);
        fs.writeFileSync(relativePath, newContent);
        console.log(`Restored ${fieldName} for ${relativePath}:`, tldrText);
      }
    }
  }
}

processDir('posts', false);
processDir('posts/ko', true);
