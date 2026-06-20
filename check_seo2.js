const fs = require('fs');
const matter = require('gray-matter');

const posts = fs.readdirSync('posts').filter(f => f.endsWith('.mdx'));
posts.forEach(post => {
  const enMeta = matter(fs.readFileSync(`posts/${post}`, 'utf8')).data;
  let koMeta = {};
  if (fs.existsSync(`posts/ko/${post}`)) {
    koMeta = matter(fs.readFileSync(`posts/ko/${post}`, 'utf8')).data;
  }

  console.log(`\n=== ${post} ===`);
  console.log(`EN: title: ${enMeta.title}`);
  console.log(`EN: title_ko: ${enMeta.title_ko}`);
  console.log(`EN: description: ${enMeta.description}`);
  console.log(`EN: description_ko: ${enMeta.description_ko}`);
  console.log(`KO: title: ${koMeta.title}`);
  console.log(`KO: description: ${koMeta.description}`);
});
