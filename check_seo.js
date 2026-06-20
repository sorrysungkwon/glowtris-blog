const fs = require('fs');
const matter = require('gray-matter');
const path = require('path');

const posts = fs.readdirSync('posts').filter(f => f.endsWith('.mdx'));
posts.forEach(post => {
  const enRaw = fs.readFileSync(`posts/${post}`, 'utf8');
  const enMeta = matter(enRaw).data;
  
  let koMeta = {};
  if (fs.existsSync(`posts/ko/${post}`)) {
    const koRaw = fs.readFileSync(`posts/ko/${post}`, 'utf8');
    koMeta = matter(koRaw).data;
  }

  console.log(`\n--- ${post} ---`);
  console.log(`EN Title: ${enMeta.title || 'MISSING'}`);
  console.log(`EN Desc:  ${enMeta.description || 'MISSING'}`);
  console.log(`KO Title: ${koMeta.title || enMeta.title_ko || 'MISSING'}`);
  console.log(`KO Desc:  ${koMeta.description || enMeta.description_ko || 'MISSING'}`);
});
