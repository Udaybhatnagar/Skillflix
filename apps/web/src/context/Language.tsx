import type { ReactNode } from 'react';
const messages = {
  home: 'Home',
  exams: 'Competitive Exams',
  skills: 'Professional Skills',
  courses: 'Explore Courses',
  teachers: 'Teachers',
  resources: 'Resources',
  search: 'Search',
  myLearning: 'My Learning',
  profile: 'Profile',
  login: 'Log in',
  signup: 'Sign up',
  hero: 'Learn with direction.',
  heroCopy:
    'Discover the right resources, follow structured learning paths, and build the skills that move you forward.',
  searchPlaceholder: 'What would you like to learn?',
  watch: 'Watch on Skillflix',
  saveRoadmap: 'Save roadmap',
  savedRoadmap: 'Saved roadmap',
  continue: 'Continue learning',
  markComplete: 'Mark complete',
  previous: 'Previous',
  next: 'Next',
  empty: 'Nothing here yet.',
  welcome: 'Welcome back.',
  createAccount: 'Create your account',
  continueEmail: 'Continue with Email',
  fullName: 'Full name',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm password',
  forgotPassword: 'Forgot password?',
  savedCourses: 'Saved courses',
  topicsComplete: 'Topics complete',
  lessonsComplete: 'Lessons complete',
  bookmarkedResources: 'Bookmarked resources',
  recentActivity: 'Recent activity',
  myCourses: 'My courses',
  markIncomplete: 'Mark incomplete',
  playlistLessons: 'Playlist lessons',
  yourLesson: 'Your lesson',
  saveCourse: 'Save course',
  savedCourse: 'Saved course',
} as const;
export type MessageKey = keyof typeof messages;
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function useLanguage() {
  return { t: (key: MessageKey): string => messages[key] };
}
