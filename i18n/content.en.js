/* 內容類資料的英文版：個人簡介、教學資源、專案簡介、寫作台文章。
   key 對應 data.js / notes.js 裡的 name 或 slug；沒列到的項目在英文模式會顯示中文原文。 */
window.EN = window.EN || {};

window.EN.profile = {
  bio: [
    "Okay, I'm actually just an ordinary student",
    "I post about daily life / useful tools / AI news. Updates are all over the place~"
  ],
  intro: "A heads-up in advance: I'm illiterate, and I share this account with my cat. If this account ever posts anything offensive, that was the cat — sorry, my cat just learned how to use the internet, so please forgive it. Whoever's cursing at people is the cat. The cat has four paws, so it types faster than I do.",
  notes: [
    "I got my very first work email address!!!",
    "Badminton"
  ]
};

/* 貼文標籤、教學分類、專案標籤（顯示用；篩選邏輯仍用中文原值） */
window.EN.tags = {
  "AI Threads": "AI Threads",
  "vibe coding": "vibe coding",
  "程式設計": "Programming",
  "學生大使": "Student Ambassador",
  "": "Daily chatter"
};

window.EN.share = {
  "apcs-judge": {
    title: "Interactive Coding Classroom × APCS Practice",
    desc: "Python · C++ · C · Java in four languages, 101 chapters of interactive lessons, 300 worked practice problems, 2,563 code-reading questions, plus AI problem-solving help and a mistake notebook — all in the browser."
  },
  "web-mysql-tutorial": {
    title: "The Web Trio × MySQL",
    desc: "A connected HTML / CSS / JS + MySQL course: 11 interactive chapters and a built-in SQL simulator in the browser."
  },
  "shell-lab": {
    title: "shell-lab",
    desc: "A command-line course where you really type commands in the browser: a hand-written shell emulator with a fake file system, where you predict first and then run, plus debugging challenges."
  },
  "fullstack-roadmap": {
    title: "Dual-Track Full-Stack Growth Plan",
    desc: "A self-study path running front end and back end in parallel, built as a checkable tracker: 5 tracks, 33 stages, 237 skill points."
  },
  "devops-roadmap": {
    title: "DevOps Engineer Roadmap",
    desc: "A 12-stage interactive learning roadmap from Linux to production infrastructure."
  },
  "ai-engineer-roadmap": {
    title: "AI Engineer Roadmap",
    desc: "A single-page interactive course on a 12-stop AI engineer path, carried through by the “DocMind smart document assistant” capstone project."
  },
  "rl-interactive-tutorial": {
    title: "Interactive Reinforcement Learning · Beginner Edition",
    desc: "For people who have never studied RL: conversational explanations, a hands-on Canvas demo in every lesson, and a built-in ML refresher that reads all the way up to DQN / PPO."
  },
  "cg-interactive-tutorial": {
    title: "Interactive Computer Graphics",
    desc: "Interactive computer graphics course material aligned with an 18-week syllabus: the pipeline, geometric transforms, lighting and shading, rasterization, curves and surfaces."
  },
  "stat-lab": {
    title: "Sleep Research Statistics Classroom",
    desc: "A 16-level interactive statistics course that uses the same sleep-study dataset to teach Excel, JASP, and SPSS at once, with reports calculated live on the page."
  },
  "senior-science": {
    title: "Physics Lab · Interactive Physics for Taiwan's Secondary Schools",
    desc: "Bridging junior-high natural science to the 108 curriculum physics: 12 learning modules and 248 live Canvas interactive simulations."
  },
  "english-learning-system": {
    title: "English Learning System",
    desc: "An English learning system that advances by “pass conditions” rather than dates: a five-gate framework plus an experience corpus."
  }
};

window.EN.projects = {
  "editorial-vision-studio": {
    desc: "A “visual director” engine for AI image generation and visual planning: it first determines the purpose and breaks down the visual language, then outputs an executable generation request."
  },
  "apcs-judge": {
    desc: "Interactive Coding Classroom × APCS Practice: 101 chapters of lessons in four languages and 300 worked practice problems."
  },
  "ppt-creator-skills": {
    desc: "Two Claude skills: turn messy documents into well-designed slide decks, and chart-integrity, which verifies charts and statistics."
  },
  "aesthetic-object-recomposer": {
    desc: "Recomposes photos of ordinary objects into three lifestyle image styles: Editorial, Kawaii Clean, and Kawaii Story."
  },
  "paper-echo-photo-cards": {
    desc: "PaperEcho: an open-source Codex skill that turns everyday photos into editorial-style Study Cards with a paper feel."
  },
  "cv-app": {
    desc: "CV Studio: a PWA workspace that combines a résumé, learning portfolio, job-search advisor, and college-entrance exam placement analysis."
  },
  "guan-she-tongue-app": {
    desc: "Guan She (Tongue Viewing): a tongue-analysis web app combining traditional Chinese medicine inspection with AI image recognition, giving daily diet and lifestyle suggestions from one photo a day."
  },
  "hypecut": {
    desc: "Drop in a long video and it automatically finds the highlights and cuts a highlight reel, with an edit list explaining why each clip was chosen."
  },
  "mbti-recovery-challenge": {
    desc: "Win-Them-Back Challenge: a text-based game about winning back an ex, with every MBTI type plus avoidant bosses — 12 scenario levels, and one wrong move means “death.”"
  },
  "levelvest": {
    desc: "The Duolingo of investing: a gamified app for learning Taiwan stocks and investing mindset, with skill-tree levels and an investment decision journal."
  },
  "jev-line-bot": {
    desc: "Strategist JEV LINE Bot: paste a single line from the other person and get their intent, a danger level, and candidate replies in three styles — it never sends messages for you."
  },
  "jev-chat-overlay": {
    desc: "Strategist JEV Chat Co-pilot (Android): reads LINE / IG chat screens and shows a floating panel with an analysis and candidate replies; it only fills them in and never sends."
  }
};

window.EN.projectTags = {
  "AI 圖像": "AI Imaging",
  "教學": "Tutorial"
};

window.EN.notes = {
  "writing-desk-guide": {
    title: "Writing Desk Guide",
    cat: "Notes",
    tags: ["Writing Desk"],
    body: "This is the first article published from the **Writing Desk** with encryption, and it doubles as the user guide.\n\n## How to publish\n1. Go to the “Writing Desk” page and paste Word, a web page, or any HTML straight into the editor — it's converted to Markdown automatically, with tables, lists, bold, and italics preserved.\n2. After you've written a title, press “Publish to site”, enter the publishing password, and paste a GitHub Token (fine-grained, with only Contents read/write permission for this repo).\n3. The article is encrypted with your password and sent into the repository; GitHub Actions decrypts it with the repository secret and writes it into the site. The password itself is never stored anywhere in the code.\n\n## Quick reminders\n- If you mistype the password, the article can't be published, and the encrypted file is moved to `notes/inbox/failed/` so it doesn't block later publishing.\n- Drafts are saved automatically in the browser; “Import file” also accepts .docx / .md / .html.\n- To delete this guide: just edit `notes.js` in the repository."
  }
};
