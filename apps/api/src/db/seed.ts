import { pool } from './pool.js';
import { readFile } from 'node:fs/promises';
interface SeedRoadmap {
  type: 'exam' | 'skill';
  slug: string;
  title: string;
  overview: string;
  stages: Array<{
    id: string;
    title: string;
    description: string;
    topics: Array<{
      id: string;
      title: string;
      description: string;
      hours: number;
      prerequisites: string[];
      resourceIds: string[];
    }>;
  }>;
}

type Item = [
  string,
  string,
  string,
  string,
  string,
  string | null,
  string | null,
  string,
  string,
  string[],
  string[],
  string,
];
const items: Item[] = [
  [
    'exam-ssc-cgl',
    'exam',
    'ssc-cgl',
    'SSC CGL',
    'SSC',
    'Intermediate',
    null,
    'Explore a structured starting point for SSC CGL preparation.',
    'Build a steady foundation in common competitive exam subjects, then use official notices to confirm the current examination pattern.',
    [
      'Plan a weekly study routine',
      'Practice core quantitative and reasoning skills',
      'Review progress with past papers',
    ],
    ['Quantitative aptitude', 'Reasoning', 'English language', 'General awareness'],
    'Begin with one subject at a time and verify current requirements on the official SSC website.',
  ],
  [
    'exam-ssc-chsl',
    'exam',
    'ssc-chsl',
    'SSC CHSL',
    'SSC',
    'Beginner',
    null,
    'A focused starting point for SSC CHSL preparation.',
    'Organize foundational study and practice with reliable source material.',
    ['Build foundational study habits', 'Practice common aptitude topics'],
    ['Quantitative aptitude', 'Reasoning', 'English language', 'General awareness'],
    'Check current official notices before planning for a specific cycle.',
  ],
  [
    'exam-ibps-po',
    'exam',
    'ibps-po',
    'IBPS PO',
    'Banking',
    'Intermediate',
    null,
    'Build a clear preparation plan for banking aptitude.',
    'Explore core banking exam preparation areas and practice consistently. Check current official notices for precise requirements.',
    ['Develop speed and accuracy', 'Practice reasoning and numerical skills', 'Plan revision'],
    ['Quantitative aptitude', 'Reasoning ability', 'English language', 'Current affairs'],
    'Start with fundamentals, then use timed practice and official notices.',
  ],
  [
    'exam-sbi-po',
    'exam',
    'sbi-po',
    'SBI PO',
    'Banking',
    'Intermediate',
    null,
    'Explore a practical route into SBI PO preparation.',
    'Use a structured foundation for banking exam study.',
    ['Practice aptitude skills', 'Set a revision schedule'],
    ['Quantitative aptitude', 'Reasoning', 'English language'],
    'Confirm the latest exam requirements through SBI Careers.',
  ],
  [
    'exam-ibps-clerk',
    'exam',
    'ibps-clerk',
    'IBPS Clerk',
    'Banking',
    'Beginner',
    null,
    'Get oriented with core banking preparation topics.',
    'Start with foundational aptitude practice.',
    ['Strengthen numerical basics', 'Practice regularly'],
    ['Numerical ability', 'Reasoning', 'English language'],
    'Work through basics before timed practice.',
  ],
  [
    'exam-rrb-ntpc',
    'exam',
    'rrb-ntpc',
    'RRB NTPC',
    'Railway',
    'Beginner',
    null,
    'Find a starting structure for railway exam preparation.',
    'Build broad preparation habits using reliable sources.',
    ['Set a study plan', 'Practice core subjects'],
    ['Mathematics', 'Reasoning', 'General awareness'],
    'Verify the latest notice on official RRB websites.',
  ],
  [
    'exam-upsc',
    'exam',
    'upsc',
    'UPSC Civil Services',
    'Others',
    'Advanced',
    null,
    'Organize a broad civil services preparation journey.',
    'Begin with a long-term plan and official source material.',
    ['Structure reading', 'Build revision habits'],
    ['Foundational reading', 'Current affairs', 'Answer practice'],
    'Use official UPSC notices and syllabus as your source of truth.',
  ],
  [
    'exam-state',
    'exam',
    'state-examinations',
    'State-level examinations',
    'Others',
    'Varies',
    null,
    'Explore preparation approaches for state examinations.',
    'Requirements vary by state and examination.',
    ['Identify official sources', 'Create a subject plan'],
    ['State-specific information', 'Aptitude foundations'],
    'Choose a specific exam and consult its official commission.',
  ],
  [
    'skill-ui',
    'skill',
    'ui-ux-design',
    'UI/UX Design',
    'Design',
    'Beginner',
    '8–12 weeks',
    'Learn research, interface design, and testing fundamentals.',
    'Explore how to understand user needs and design usable digital interfaces.',
    ['Frame a user problem', 'Create wireframes', 'Test and refine an interface'],
    [
      'User research',
      'Information architecture',
      'Wireframing',
      'Visual design',
      'Usability testing',
    ],
    'Start with a small everyday problem and document each design decision.',
  ],
  [
    'skill-graphic',
    'skill',
    'graphic-design',
    'Graphic Design',
    'Design',
    'Beginner',
    '6–10 weeks',
    'Build visual communication fundamentals.',
    'Learn composition, typography, and visual storytelling.',
    ['Apply layout principles', 'Create a visual system'],
    ['Typography', 'Colour', 'Layout', 'Portfolio projects'],
    'Recreate simple layouts for practice, then make original work.',
  ],
  [
    'skill-web',
    'skill',
    'web-development',
    'Web Development',
    'Technology',
    'Beginner',
    '12–16 weeks',
    'Learn to build accessible websites.',
    'Move from web fundamentals to small interactive projects.',
    ['Build responsive pages', 'Use JavaScript for interactions'],
    ['HTML and CSS', 'JavaScript', 'React basics', 'Deployment'],
    'Build and publish small projects as you learn.',
  ],
  [
    'skill-python',
    'skill',
    'python',
    'Python',
    'Technology',
    'Beginner',
    '8–12 weeks',
    'Learn programming through practical Python projects.',
    'Practice core programming concepts in Python.',
    ['Write simple programs', 'Use functions and data structures'],
    ['Syntax', 'Control flow', 'Functions', 'Projects'],
    'Practice a small exercise every day.',
  ],
  [
    'skill-excel',
    'skill',
    'advanced-excel',
    'Advanced Excel',
    'Business',
    'Intermediate',
    '4–6 weeks',
    'Go beyond basic spreadsheets with analysis workflows.',
    'Explore formulas, tables, and practical data analysis.',
    ['Use lookup formulas', 'Summarize data'],
    ['Formulas', 'Pivot tables', 'Data cleaning', 'Dashboards'],
    'Use a real dataset and check each calculation.',
  ],
  [
    'skill-marketing',
    'skill',
    'digital-marketing',
    'Digital Marketing',
    'Business',
    'Beginner',
    '6–10 weeks',
    'Understand channels, content, and measurement.',
    'Build a foundation in digital campaign planning.',
    ['Plan content', 'Read basic performance metrics'],
    ['Channels', 'Content strategy', 'Analytics', 'Campaign planning'],
    'Start with a small campaign brief and measurable goal.',
  ],
  [
    'skill-video',
    'skill',
    'video-editing',
    'Video Editing',
    'Creative',
    'Beginner',
    '6–8 weeks',
    'Learn to shape stories through editing.',
    'Practice pacing, sound, and basic post-production.',
    ['Edit a short sequence', 'Improve audio and pacing'],
    ['Story structure', 'Timeline editing', 'Sound', 'Exporting'],
    'Make a short project from your own footage.',
  ],
];
const resources = [
  [
    'res-figma',
    'Figma for beginners: create designs',
    'Video',
    'Design',
    'English',
    'Figma',
    'https://www.youtube.com/watch?v=wvFd-z7jSaA',
    'ui-ux-design',
  ],
  [
    'res-figma-playlist',
    'Figma for beginners tutorials',
    'Playlist',
    'Design',
    'English',
    'Figma',
    'https://www.youtube.com/playlist?list=PLXDU_eVOJTx7QHLShNqIXL1Cgbxj7HlN4',
    'ui-ux-design',
  ],
  [
    'res-freecodecamp',
    'Learn HTML and CSS',
    'Video',
    'Technology',
    'English',
    'freeCodeCamp.org',
    'https://www.youtube.com/watch?v=a_iQb1lnAEQ',
    'web-development',
  ],
  [
    'res-python',
    'Python for beginners',
    'Video',
    'Technology',
    'English',
    'freeCodeCamp.org',
    'https://www.youtube.com/watch?v=eWRfhZUzrAc',
    'python',
  ],
  [
    'res-ssc',
    'SSC CGL revision marathon',
    'Video',
    'Exams',
    'Hindi',
    'Adda247 SSC CGL',
    'https://www.youtube.com/watch?v=fFS0U63Jq2Q',
    'ssc-cgl',
  ],
];
const educators = [
  [
    'figma',
    'figma',
    'Figma',
    'Publisher',
    'Design',
    'Official tutorials and product education from Figma.',
    'https://www.youtube.com/@Figma',
    ['UI/UX Design', 'Visual Design'],
    ['English'],
    ['Beginner'],
    ['ui-ux-design'],
  ],
  [
    'freecodecamp',
    'freecodecamp',
    'freeCodeCamp.org',
    'Publisher',
    'Technology',
    'Free programming and web development courses from freeCodeCamp.org.',
    'https://www.youtube.com/@freecodecamp',
    ['Web Development', 'Python'],
    ['English'],
    ['Beginner'],
    ['web-development', 'python'],
  ],
  [
    'adda247-ssc',
    'adda247-ssc',
    'Adda247 SSC CGL',
    'Publisher',
    'Exams',
    'SSC preparation videos published by the Adda247 SSC CGL channel.',
    'https://www.youtube.com/channel/UCV6HCLPearneK6wLQ-WitUA',
    ['SSC CGL', 'Quantitative Aptitude', 'Reasoning'],
    ['Hindi'],
    ['Intermediate'],
    ['ssc-cgl'],
  ],
];
const resourceDetails: Record<string, [string, string, string, string | null]> = {
  'res-figma': [
    'Visual Design',
    'Beginner',
    'figma',
    'https://i.ytimg.com/vi/wvFd-z7jSaA/hqdefault.jpg',
  ],
  'res-figma-playlist': ['Design Fundamentals', 'Beginner', 'figma', null],
  'res-freecodecamp': [
    'HTML and CSS',
    'Beginner',
    'freecodecamp',
    'https://i.ytimg.com/vi/a_iQb1lnAEQ/hqdefault.jpg',
  ],
  'res-python': [
    'Python Basics',
    'Beginner',
    'freecodecamp',
    'https://i.ytimg.com/vi/eWRfhZUzrAc/hqdefault.jpg',
  ],
  'res-ssc': [
    'Practice and Revision',
    'Intermediate',
    'adda247-ssc',
    'https://i.ytimg.com/vi/fFS0U63Jq2Q/hqdefault.jpg',
  ],
};
try {
  for (const i of items)
    await pool.query(
      'INSERT INTO catalog_items (id,kind,slug,title,category,level,duration,summary,overview,outcomes,modules,guidance) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, overview=EXCLUDED.overview, outcomes=EXCLUDED.outcomes, modules=EXCLUDED.modules, guidance=EXCLUDED.guidance',
      i,
    );
  for (const r of resources)
    await pool.query(
      'INSERT INTO resources (id,title,kind,category,language,creator,url,related_slug) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING',
      r,
    );
  await pool.query("DELETE FROM resources WHERE id='res-banking'");
  for (const e of educators)
    await pool.query(
      'INSERT INTO educators (id,slug,name,kind,focus,description,channel_url,subjects,languages,levels,path_slugs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING',
      e,
    );
  for (const [id, [topic, level, educator, thumbnail]] of Object.entries(resourceDetails))
    await pool.query(
      "UPDATE resources SET topic=$2,level=$3,educator_slug=$4,thumbnail_url=$5 WHERE id=$1 AND topic='General'",
      [id, topic, level, educator, thumbnail],
    );
  await pool.query("UPDATE resources SET slug=REPLACE(id,'res-','') WHERE slug IS NULL");
  await pool.query(
    "UPDATE resources SET video_id=SUBSTRING(url FROM '[?&]v=([^&]+)') WHERE kind='Video' AND video_id IS NULL",
  );
  await pool.query(
    "UPDATE resources SET playlist_id=SUBSTRING(url FROM '[?&]list=([^&]+)') WHERE kind='Playlist' AND playlist_id IS NULL",
  );
  await pool.query(
    "INSERT INTO courses (id,kind,slug,title,description,category,difficulty,estimated_duration,outcomes,modules,guidance) SELECT id,kind,slug,title,overview,category,COALESCE(level,'Beginner'),duration,outcomes,modules,guidance FROM catalog_items ON CONFLICT (id) DO NOTHING",
  );
  const roadmapData = JSON.parse(
    await readFile(new URL('./roadmaps.json', import.meta.url), 'utf8'),
  ) as SeedRoadmap[];
  for (const roadmap of roadmapData) {
    const roadmapId = `${roadmap.type}:${roadmap.slug}`;
    const course = await pool.query<{ id: string }>(
      'SELECT id FROM courses WHERE kind=$1 AND slug=$2',
      [roadmap.type, roadmap.slug],
    );
    if (!course.rows[0]) throw new Error(`Missing course for ${roadmapId}`);
    await pool.query(
      'INSERT INTO roadmaps (id,course_id,title,overview) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',
      [roadmapId, course.rows[0].id, roadmap.title, roadmap.overview],
    );
    for (const [stageIndex, stage] of roadmap.stages.entries()) {
      const stageId = `${roadmapId}:${stage.id}`;
      await pool.query(
        'INSERT INTO roadmap_stages (id,roadmap_id,title,description,position) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
        [stageId, roadmapId, stage.title, stage.description, stageIndex],
      );
      for (const [topicIndex, topic] of stage.topics.entries()) {
        await pool.query(
          'INSERT INTO roadmap_topics (id,stage_id,title,description,hours,prerequisites,position) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING',
          [
            topic.id,
            stageId,
            topic.title,
            topic.description,
            topic.hours,
            topic.prerequisites,
            topicIndex,
          ],
        );
        for (const resourceId of topic.resourceIds)
          await pool.query(
            'INSERT INTO topic_resources (topic_id,resource_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [topic.id, resourceId],
          );
      }
    }
  }
  await pool.query(
    "INSERT INTO playlists (id,resource_id,youtube_playlist_id) SELECT id,id,playlist_id FROM resources WHERE kind='Playlist' AND playlist_id IS NOT NULL ON CONFLICT (id) DO NOTHING",
  );
  await pool.query(
    "INSERT INTO playlist_videos (id,playlist_id,resource_id,position) SELECT 'seed:figma-lesson','res-figma-playlist','res-figma',0 WHERE EXISTS (SELECT 1 FROM playlists WHERE id='res-figma-playlist') ON CONFLICT (id) DO NOTHING",
  );
  await pool.query(
    'INSERT INTO course_teachers (course_id,educator_id) SELECT c.id,e.id FROM courses c JOIN educators e ON c.slug=ANY(e.path_slugs) ON CONFLICT DO NOTHING',
  );
  await pool.query(
    "INSERT INTO categories (id,name) SELECT LOWER(REPLACE(category,' ','-')),category FROM courses ON CONFLICT DO NOTHING",
  );
  console.log('Catalog seeded');
} finally {
  await pool.end();
}
