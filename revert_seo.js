const fs = require('fs');
const matter = require('gray-matter');
const path = require('path');

const originals = {
  "ai-game-development-military-designer.mdx": {
    en: {
      title: "Why I'm Writing This, and Who It's For",
      description: "I'm a designer in the military who built a game with AI. Here's the honest story of how it happened, what broke, and why it matters."
    },
    ko: {
      title: "글로우트리스 블로그, 누군가의 바이브코딩 성장 기록",
      description: "군대 연등시간에 아이패드 하나로 AI와 브라우저 테트리스를 만들고, 레딧에서 산산조각 났던 처절한 삽질 기록. 코딩 못하는 7년차 디자이너의 생존기."
    }
  },
  "designer-vibe-coding-ai-game-ui.mdx": {
    en: {
      title: "7-Year Designer Who Can’t Code Made a Game With AI. What Happened.",
      description: "I’m a 7-year designer who can’t code. I built a game UI and blog by talking to Claude. Here’s what worked, what prompting couldn’t fix."
    },
    ko: {
      title: "코딩 모르는 7년차 디자이너가 AI랑 게임을 만들면 생기는 일",
      description: "7년차 디자이너가 코딩 한 줄 없이 AI(Claude)에게 입만 털어서 브라우저 테트리스 게임과 블로그를 통째로 런칭한 실전 프롬프팅 노하우와 디자인 시스템 적용기."
    }
  },
  "fix-giscus-iframe-layout-shift.mdx": {
    en: {
      title: "A Designer's Obsession: Flawlessly Fixing Giscus Iframe Layout Shift (CLS)",
      description: "How a designer's eye caught a 1px error and 0.1s flicker. Fixing iframe layout shifts with CSS Grid overlay and postMessage control."
    },
    ko: {
      title: "어느 디자이너의 집착: Giscus 댓글창 Layout Shift(CLS) 완벽 해결기",
      description: "남들은 안 보는 1px의 오차와 0.1초의 깜빡임. Iframe 로딩 시 발생하는 푸터 널뛰기와 이질감을 디자이너의 눈으로 잡아내고 CSS Grid로 완벽하게 통제한 과정."
    }
  },
  "github-credential-leak-near-miss.mdx": {
    en: {
      title: "That Time Almost Caused a Security Disaster by Pushing Keys to GitHub",
      description: "A terrifying near-miss of leaking security credentials to a public GitHub repo during a late-night coding session, and the lessons learned."
    },
    ko: {
      title: "깃허브에 보안 키 올렸다가 식은땀 흘린 썰 (feat. 티빙 보안사고)",
      description: "군대 연등시간에 깃허브 퍼블릭 레포지토리에 보안 키를 올렸던 아찔한 경험과 그로부터 배운 교훈을 솔직하게 공유합니다."
    }
  },
  "timezone-aware-leaderboard-how-we-built-it.mdx": {
    en: {
      title: "Whose midnight counts? Building a timezone-aware leaderboard",
      description: "Duolingo keeps your streak alive even when you land in a timezone from yesterday. I wanted the same for Glowtris — here’s how I built it."
    },
    ko: {
      title: "서울에서 자정에 게임을 하고 비행기를 탔다. 스트릭은 깨졌을까?",
      description: "비행기를 타고 뉴욕에 내려도 듀오링고 스트릭은 그대로 유지됩니다. 이 미친 타임존 처리 마법을 글로우트리스 리더보드에 똑같이 구현하면서 배운 실전 노하우."
    }
  }
};

for (const [filename, meta] of Object.entries(originals)) {
  const enPath = `posts/${filename}`;
  const koPath = `posts/ko/${filename}`;

  // Update EN
  if (fs.existsSync(enPath)) {
    const enFile = matter(fs.readFileSync(enPath, 'utf8'));
    enFile.data.title = meta.en.title;
    enFile.data.description = meta.en.description;
    delete enFile.data.title_ko;
    delete enFile.data.description_ko;
    fs.writeFileSync(enPath, matter.stringify(enFile.content, enFile.data));
  }

  // Update KO
  if (fs.existsSync(koPath)) {
    const koFile = matter(fs.readFileSync(koPath, 'utf8'));
    koFile.data.title = meta.ko.title;
    koFile.data.description = meta.ko.description;
    delete koFile.data.title_ko;
    delete koFile.data.description_ko;
    fs.writeFileSync(koPath, matter.stringify(koFile.content, koFile.data));
  }
}
console.log('Revert complete.');
