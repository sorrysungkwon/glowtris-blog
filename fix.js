const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'posts');
const koDir = path.join(__dirname, 'posts', 'ko');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove all variations of manual TLDR blockquotes
    content = content.replace(/^\s*>.*?\bTL;DR\b.*?(?:\n\s*>.*)*\n+/gmi, '');
    content = content.replace(/^\s*>.*?\b요약\b.*?(?:\n\s*>.*)*\n+/gmi, '');
    
    // Fallback specific removal
    content = content.replace(/> \*\*요약:\*\* 깃허브에 보안 키를 실수로 올려도 시스템이 100% 경고해주지 않습니다. 유출을 확인했다면 파일 삭제로 끝내지 말고, 즉시 해당 키를 폐기\(Revoke\)한 후 새로 발급받아야 대참사를 막을 수 있습니다\.\n\n/g, '');

    fs.writeFileSync(filePath, content);
  }
}

processDir(postsDir);
processDir(koDir);
