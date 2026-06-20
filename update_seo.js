const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const posts = {
  'ai-game-development-military-designer': {
    en: {
      tldr: "Transitioning from a military designer to an AI game developer required shifting from rigid, top-down execution to a more iterative, vibe-based coding workflow. AI bridges the gap between design vision and technical implementation.",
      faq: [
        { question: "How does military design differ from game UI design?", answer: "Military design focuses on rigid, standardized systems for extreme clarity, while game UI often requires dynamic, engaging, and atmospheric elements." },
        { question: "Can a non-technical designer build games with AI?", answer: "Yes, by leveraging tools like Claude, designers can use their visual intuition to guide the AI's coding process without writing the code themselves." }
      ]
    },
    ko: {
      tldr: "군대 디자이너의 엄격한 탑다운 방식에서 벗어나, AI를 활용한 유연한 바이브 코딩으로 게임 개발에 도전했습니다. 코딩 지식이 없어도 기획력과 디자인 감각만으로 AI와 협업하여 게임을 완성할 수 있습니다.",
      faq: [
        { question: "군대 디자인과 게임 디자인의 차이는 무엇인가요?", answer: "군대 디자인은 극한의 가독성과 표준화된 시스템을 중시하는 반면, 게임 디자인은 유저의 흥미를 유발하는 동적이고 감각적인 요소가 중요합니다." },
        { question: "비전공자나 비개발자도 AI로 게임을 만들 수 있나요?", answer: "네, AI 코딩 어시스턴트를 활용하면 개발 지식 없이도 디자인 직관과 프롬프트만으로 게임 UI와 로직을 구현할 수 있습니다." }
      ]
    }
  },
  'fix-giscus-iframe-layout-shift': {
    en: {
      tldr: "To fix Cumulative Layout Shift (CLS) caused by Giscus loading asynchronously, we implemented a CSS Grid overlay. A skeleton loader is displayed immediately, and the iframe smoothly fades in once it completes loading.",
      faq: [
        { question: "What causes CLS with Giscus comments?", answer: "Giscus runs in an iframe that loads asynchronously. Because its initial height is unknown, it pushes content down when it finally renders, causing a layout shift." },
        { question: "How do you prevent iframe layout shift?", answer: "You can use a skeleton loader overlay and CSS Grid. The skeleton holds the space, and the iframe fades in once loaded using the onLoad event." }
      ]
    },
    ko: {
      tldr: "Giscus 댓글 창이 늦게 로딩되면서 발생하는 CLS(레이아웃 밀림 현상)를 해결하기 위해 CSS Grid와 스켈레톤 UI를 도입했습니다. 스켈레톤이 공간을 미리 확보하고, 로딩이 완료되면 자연스럽게 페이드인 됩니다.",
      faq: [
        { question: "Giscus 사용 시 CLS가 발생하는 이유는 무엇인가요?", answer: "Giscus는 비동기로 로드되는 iframe이므로 초기 높이를 알 수 없습니다. 렌더링이 완료된 후 높이가 갑자기 커지면서 주변 레이아웃을 밀어내는 현상이 발생합니다." },
        { question: "iframe의 CLS를 어떻게 방지할 수 있나요?", answer: "스켈레톤 UI가 미리 자리를 차지하게 한 뒤, iframe의 onLoad 이벤트를 감지하여 부드럽게 페이드인(Fade-in) 되도록 CSS Grid로 겹치면 해결됩니다." }
      ]
    }
  },
  'github-credential-leak-near-miss': {
    en: {
      tldr: "Accidentally pushing an .env file with production credentials to GitHub is a common but dangerous mistake. We mitigated this by immediately revoking the keys and enforcing strict .gitignore policies and environment variables in Vercel.",
      faq: [
        { question: "What should I do if I push an .env file to GitHub?", answer: "Immediately revoke all compromised API keys and passwords. Then, remove the file from your repository's history and ensure .env is added to your .gitignore." },
        { question: "How to safely manage API keys in Next.js?", answer: "Use environment variables configured directly in your hosting provider (like Vercel). Never commit local .env files to version control." }
      ]
    },
    ko: {
      tldr: "프로덕션 API 키가 담긴 .env 파일을 깃허브에 잘못 푸시하는 아찔한 실수를 겪었습니다. 즉각적인 키 폐기 조치와 Vercel 환경 변수 세팅, 그리고 강력한 .gitignore 정책으로 문제를 해결했습니다.",
      faq: [
        { question: ".env 파일을 깃허브에 올렸을 때 어떻게 대처해야 하나요?", answer: "유출된 모든 API 키를 즉시 폐기(Revoke)하고 재발급 받아야 합니다. 이후 깃허브 히스토리에서 해당 파일을 삭제하고 .gitignore에 확실히 등록하세요." },
        { question: "Next.js에서 환경 변수를 안전하게 관리하는 방법은?", answer: "로컬의 .env 파일은 절대 커밋하지 말고, Vercel 등의 호스팅 플랫폼 설정 패널에 직접 환경 변수를 입력하여 관리해야 합니다." }
      ]
    }
  },
  'timezone-aware-leaderboard-how-we-built-it': {
    en: {
      tldr: "Building a global daily leaderboard requires handling timezones correctly so that 'midnight' resets fairly for everyone. We used UTC as the absolute source of truth and shifted the presentation layer based on the user's local browser timezone.",
      faq: [
        { question: "Why is handling timezones difficult in daily leaderboards?", answer: "Because midnight happens at different times across the world. If the server resets at UTC midnight, players in Asia might see their scores reset in the middle of the afternoon." },
        { question: "How to implement a fair daily leaderboard?", answer: "Store all timestamps in UTC on the server. On the client side, calculate the remaining time until the next local midnight using the browser's timezone." }
      ]
    },
    ko: {
      tldr: "전 세계 유저가 참여하는 데일리 리더보드를 공평하게 운영하려면 타임존(Timezone) 처리가 필수적입니다. 서버는 철저하게 UTC 기준으로 데이터를 관리하고, 프론트엔드에서 유저의 로컬 시간에 맞춰 자정 리셋을 시각적으로 처리했습니다.",
      faq: [
        { question: "데일리 리더보드에서 타임존 처리가 왜 중요한가요?", answer: "국가마다 자정이 오는 시간이 다르기 때문입니다. 서버 기준 자정으로 획일화하면, 아시아권 유저는 한창 게임을 즐기는 오후에 점수가 초기화되는 불편을 겪게 됩니다." },
        { question: "타임존을 고려한 리더보드는 어떻게 구현하나요?", answer: "서버 DB에는 모든 시간을 UTC 기준으로 저장하고, 클라이언트(브라우저) 측에서 로컬 타임존을 감지하여 다음 자정까지 남은 시간을 계산해 보여주는 방식을 사용합니다." }
      ]
    }
  },
  'designer-vibe-coding-ai-game-ui': {
    ko: {
      tldr: "코딩을 전혀 모르는 7년 차 디자이너가 AI 프롬프팅(바이브 코딩)만으로 게임 UI를 완성했습니다. AI가 코드의 뼈대를 잡지만, 미세한 여백이나 타이포그래피, 다크 모드 색상 튜닝은 여전히 디자이너의 직관이 필수적입니다.",
      faq: [
        { question: "바이브 코딩(Vibe Coding)이란 무엇인가요?", answer: "직접 코드를 타이핑하는 대신, 자연어 프롬프트를 통해 AI에게 시각적 형태나 로직을 지시하여 결과물을 만들어내는 코딩 방식을 의미합니다." },
        { question: "AI가 UI 디자인을 완벽하게 대체할 수 있나요?", answer: "아닙니다. 전반적인 레이아웃은 빠르게 생성하지만, 디테일한 타이포그래피 스케일, 여백, 마이크로 인터랙션 등은 여전히 사람의 개입과 조정이 필요합니다." }
      ]
    }
  }
};

const postsDir = path.join(__dirname, 'posts');
const koDir = path.join(__dirname, 'posts', 'ko');

function processDir(dir, lang) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
  for (const file of files) {
    const slug = file.replace('.mdx', '');
    const data = posts[slug];
    if (data && data[lang]) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(content);
      
      // Update frontmatter
      if (!parsed.data.tldr && !parsed.data.tldr_ko) {
        if (lang === 'ko') parsed.data.tldr_ko = data[lang].tldr;
        else parsed.data.tldr = data[lang].tldr;
      }
      if (!parsed.data.faq && !parsed.data.faq_ko) {
        if (lang === 'ko') parsed.data.faq_ko = data[lang].faq;
        else parsed.data.faq = data[lang].faq;
      }

      // Convert back
      const newContent = matter.stringify(parsed.content, parsed.data);
      fs.writeFileSync(filePath, newContent);
      console.log(`Updated ${file} (${lang})`);
    }
  }
}

processDir(postsDir, 'en');
processDir(koDir, 'ko');
