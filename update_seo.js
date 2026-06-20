const fs = require('fs');
const matter = require('gray-matter');
const path = require('path');

const updates = {
  "ai-game-development-military-designer.mdx": {
    en: {
      title: "AI Game Development Diary: How a Military Designer Built Glowtris",
      description: "I'm a designer in the military who built a browser game (Glowtris) using AI without coding experience. Here's the honest story of my Vibe Coding journey."
    },
    ko: {
      title: "글로우트리스 블로그: 군대 연등시간에 시작된 AI 바이브코딩 생존기",
      description: "코딩 모르는 7년차 디자이너가 군대 연등시간에 아이패드 하나로 AI와 브라우저 게임을 만들고, 레딧에서 산산조각 났던 처절한 바이브코딩(Vibe Coding) 성장 기록."
    }
  },
  "designer-vibe-coding-ai-game-ui.mdx": {
    en: {
      title: "Vibe Coding a Game UI with AI: A Designer's No-Code Journey",
      description: "How a 7-year designer with zero coding experience built the Glowtris game UI and Next.js blog by talking to Claude. Real prompting tips and design system insights."
    },
    ko: {
      title: "코딩 모르는 7년 차 디자이너의 AI 바이브코딩 게임 UI 제작기",
      description: "코딩 한 줄 없이 AI(Claude)에게 입만 털어서 브라우저 게임과 Next.js 블로그를 통째로 런칭한 실전 프롬프팅 노하우와 디자인 시스템 적용기."
    }
  },
  "fix-giscus-iframe-layout-shift.mdx": {
    en: {
      title: "Fixing Giscus Iframe Layout Shift (CLS) in Next.js: A Designer's Guide",
      description: "How to fix iframe layout shifts and UI flickering when loading Giscus comments. A complete guide to CSS Grid overlay and postMessage timing control."
    },
    ko: {
      title: "Giscus 댓글창 Layout Shift(CLS) 완벽 해결: Next.js 블로그 최적화",
      description: "Iframe 로딩 시 발생하는 푸터 널뛰기(Layout Shift)와 깜빡임을 디자이너의 눈으로 잡아내고 CSS Grid와 postMessage로 완벽하게 통제한 프론트엔드 최적화 과정."
    }
  },
  "github-credential-leak-near-miss.mdx": {
    en: {
      title: "Almost Leaking API Keys to GitHub: A Security Near-Miss Story",
      description: "A terrifying near-miss of leaking security credentials to a public GitHub repository during a late-night coding session, and essential security lessons learned."
    },
    ko: {
      title: "깃허브(GitHub)에 API 보안 키 올릴 뻔한 아찔한 썰과 보안 수칙",
      description: "군대 연등시간에 깃허브 퍼블릭 레포지토리에 주요 보안 키를 올릴 뻔했던 아찔한 경험과, 티빙 보안사고 사례를 통해 배운 필수 보안 수칙을 공유합니다."
    }
  },
  "timezone-aware-leaderboard-how-we-built-it.mdx": {
    en: {
      title: "Building a Timezone-Aware Leaderboard: The Midnight Reset Logic",
      description: "How to handle user timezones for daily streaks, just like Duolingo. The complete backend logic for building a timezone-aware leaderboard for Glowtris."
    },
    ko: {
      title: "글로우트리스 리더보드 타임존 처리 완벽 가이드: 자정 리셋 로직",
      description: "비행기를 타고 타임존이 바뀌어도 스트릭은 유지되어야 한다! 듀오링고의 타임존 처리 마법을 벤치마킹하여 개발한 날짜 기반 리더보드 구현 실전 노하우."
    }
  }
};

for (const [filename, meta] of Object.entries(updates)) {
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
console.log('Update complete.');
