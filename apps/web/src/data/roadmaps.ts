import type { Roadmap, RoadmapTopic } from '../types/roadmap';
const topic = (
  id: string,
  title: string,
  description: string,
  hours: number,
  prerequisites: string[] = [],
  resourceIds: string[] = [],
): RoadmapTopic => ({ id, title, description, hours, prerequisites, resourceIds });
export const roadmaps: Roadmap[] = [
  {
    type: 'exam',
    slug: 'ssc-cgl',
    title: 'SSC CGL preparation roadmap',
    overview:
      'A subject-oriented practice route. This is an illustrative learning plan, not an official syllabus. Check current SSC notices before planning for an exam cycle.',
    stages: [
      {
        id: 'quant',
        title: 'Quantitative Aptitude',
        description: 'Build numerical fluency before timed practice.',
        topics: [
          topic(
            'number-basics',
            'Number basics',
            'Review arithmetic, fractions, percentages, and ratios through worked examples.',
            8,
          ),
          topic(
            'quant-practice',
            'Quantitative practice',
            'Apply number skills to mixed problem sets and record recurring errors.',
            10,
            ['Number basics'],
          ),
        ],
      },
      {
        id: 'reasoning',
        title: 'Reasoning',
        description: 'Practice patterns and clear problem-solving steps.',
        topics: [
          topic(
            'reasoning-foundations',
            'Reasoning foundations',
            'Work through common verbal and non-verbal reasoning patterns.',
            8,
          ),
          topic(
            'reasoning-timed',
            'Timed reasoning',
            'Complete short timed sets and review the method behind each error.',
            8,
            ['Reasoning foundations'],
          ),
        ],
      },
      {
        id: 'english',
        title: 'English',
        description: 'Strengthen reading and language accuracy.',
        topics: [
          topic(
            'english-reading',
            'Reading practice',
            'Read short passages, summarize ideas, and check comprehension.',
            7,
          ),
          topic(
            'english-usage',
            'English usage',
            'Practice grammar and vocabulary in context.',
            7,
            ['Reading practice'],
          ),
        ],
      },
      {
        id: 'awareness',
        title: 'General Awareness',
        description: 'Use dependable sources and regular revision.',
        topics: [
          topic(
            'awareness-notes',
            'Build concise notes',
            'Organize broad general awareness topics using reliable sources.',
            8,
          ),
          topic(
            'awareness-recall',
            'Recall and review',
            'Use short quizzes and revisit weak areas.',
            6,
            ['Build concise notes'],
          ),
        ],
      },
      {
        id: 'revision',
        title: 'Practice and Revision',
        description: 'Bring the subjects together.',
        topics: [
          topic(
            'mixed-practice',
            'Mixed practice',
            'Attempt mixed sets and analyze accuracy by subject.',
            10,
            ['Quantitative practice', 'Timed reasoning', 'English usage'],
          ),
          topic(
            'revision-plan',
            'Revision plan',
            'Create a repeatable review schedule based on mistakes.',
            6,
            ['Mixed practice'],
            ['res-ssc'],
          ),
        ],
      },
    ],
  },
  {
    type: 'exam',
    slug: 'ibps-po',
    title: 'IBPS PO preparation roadmap',
    overview:
      'A subject-oriented route for banking aptitude. It is an illustrative learning plan, not an official syllabus or exam pattern.',
    stages: [
      {
        id: 'numbers',
        title: 'Quantitative Aptitude',
        description: 'Establish core numerical skills.',
        topics: [
          topic(
            'bank-arithmetic',
            'Arithmetic foundations',
            'Practice percentages, ratios, averages, and calculations.',
            9,
          ),
          topic(
            'bank-quant',
            'Applied quantitative sets',
            'Solve mixed questions and review accuracy.',
            10,
            ['Arithmetic foundations'],
          ),
        ],
      },
      {
        id: 'logic',
        title: 'Reasoning Ability',
        description: 'Build a deliberate problem-solving method.',
        topics: [
          topic(
            'bank-reasoning',
            'Reasoning fundamentals',
            'Work through logic and pattern exercises with written steps.',
            8,
          ),
          topic(
            'bank-puzzles',
            'Puzzle practice',
            'Practice multi-step sets and review where time is lost.',
            9,
            ['Reasoning fundamentals'],
          ),
        ],
      },
      {
        id: 'language',
        title: 'English Language',
        description: 'Improve comprehension and usage.',
        topics: [
          topic(
            'bank-reading',
            'Reading comprehension',
            'Read and summarize passages before answering questions.',
            7,
          ),
          topic(
            'bank-english',
            'Language practice',
            'Review grammar, vocabulary, and sentence clarity.',
            7,
            ['Reading comprehension'],
          ),
        ],
      },
      {
        id: 'awareness',
        title: 'Current Affairs',
        description: 'Build a consistent reading habit.',
        topics: [
          topic(
            'bank-sources',
            'Choose reliable sources',
            'Set a weekly reading and note-taking routine.',
            5,
          ),
          topic(
            'bank-review',
            'Weekly recall',
            'Summarize and revisit key themes without memorizing unsupported claims.',
            6,
            ['Choose reliable sources'],
          ),
        ],
      },
      {
        id: 'practice',
        title: 'Practice and Revision',
        description: 'Combine skills with timed review.',
        topics: [
          topic(
            'bank-timed',
            'Timed mixed sets',
            'Attempt mixed practice and track weak areas.',
            10,
            ['Applied quantitative sets', 'Puzzle practice'],
          ),
          topic(
            'bank-revise',
            'Targeted revision',
            'Revisit mistakes and adjust the next practice block.',
            6,
            ['Timed mixed sets'],
          ),
        ],
      },
    ],
  },
  {
    type: 'skill',
    slug: 'ui-ux-design',
    title: 'UI/UX Design learning roadmap',
    overview:
      'A project-oriented path from design foundations to a small portfolio case study. Estimated time is a planning guide and varies by learner.',
    stages: [
      {
        id: 'fundamentals',
        title: 'Design Fundamentals',
        description: 'Learn the language of useful interfaces.',
        topics: [
          topic(
            'design-principles',
            'Interface principles',
            'Study hierarchy, spacing, contrast, and accessible defaults.',
            7,
          ),
          topic(
            'design-critique',
            'Critique an interface',
            'Describe what works and what creates friction in a familiar app.',
            5,
            ['Interface principles'],
          ),
        ],
      },
      {
        id: 'research',
        title: 'User Research',
        description: 'Understand a real problem before drawing screens.',
        topics: [
          topic(
            'research-question',
            'Frame a user problem',
            'Write a focused problem statement and assumptions.',
            6,
          ),
          topic(
            'research-conversations',
            'Research conversations',
            'Prepare open questions and synthesize a few observations.',
            8,
            ['Frame a user problem'],
          ),
        ],
      },
      {
        id: 'wireframes',
        title: 'Wireframing',
        description: 'Explore structure quickly.',
        topics: [
          topic(
            'user-flow',
            'Map a task flow',
            'Outline the steps a user takes to complete one task.',
            5,
            ['Frame a user problem'],
          ),
          topic(
            'low-fi',
            'Low-fidelity wireframes',
            'Sketch multiple layouts and choose one to test.',
            8,
            ['Map a task flow'],
          ),
        ],
      },
      {
        id: 'visual',
        title: 'Visual Design',
        description: 'Turn structure into a consistent interface.',
        topics: [
          topic(
            'visual-system',
            'Create a visual system',
            'Define type, color, spacing, and basic components.',
            8,
            ['Low-fidelity wireframes'],
            ['res-figma-playlist'],
          ),
          topic(
            'high-fi',
            'Design key screens',
            'Apply the system to a small set of connected screens.',
            10,
            ['Create a visual system'],
            ['res-figma'],
          ),
        ],
      },
      {
        id: 'prototype',
        title: 'Prototyping',
        description: 'Make the flow testable.',
        topics: [
          topic(
            'prototype-flow',
            'Build a prototype',
            'Link key screens and make primary actions clear.',
            8,
            ['Design key screens'],
            ['res-figma-playlist'],
          ),
          topic(
            'usability-check',
            'Run a usability check',
            'Watch someone attempt the task and record friction.',
            6,
            ['Build a prototype'],
          ),
        ],
      },
      {
        id: 'portfolio',
        title: 'Portfolio Project',
        description: 'Explain the work and what changed.',
        topics: [
          topic(
            'iterate',
            'Refine the design',
            'Use test observations to improve the interface.',
            8,
            ['Run a usability check'],
          ),
          topic(
            'case-study',
            'Write a case study',
            'Document the problem, process, decisions, and outcome.',
            8,
            ['Refine the design'],
          ),
        ],
      },
    ],
  },
];
export const getRoadmap = (type: string, slug: string) =>
  roadmaps.find((r) => r.type === type && r.slug === slug);
export const roadmapTopics = (roadmap: Roadmap) => roadmap.stages.flatMap((stage) => stage.topics);
export const roadmapHours = (roadmap: Roadmap) =>
  roadmapTopics(roadmap).reduce((sum, topic) => sum + topic.hours, 0);
