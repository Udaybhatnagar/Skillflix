CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('exam','skill')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT,
  duration TEXT,
  summary TEXT NOT NULL,
  overview TEXT NOT NULL,
  outcomes TEXT[] NOT NULL DEFAULT '{}',
  modules TEXT[] NOT NULL DEFAULT '{}',
  guidance TEXT NOT NULL,
  UNIQUE(kind, slug)
);
CREATE TABLE IF NOT EXISTS educators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  focus TEXT NOT NULL,
  description TEXT NOT NULL
);
ALTER TABLE educators ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE educators ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'Publisher';
ALTER TABLE educators ADD COLUMN IF NOT EXISTS subjects TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE educators ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE educators ADD COLUMN IF NOT EXISTS levels TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE educators ADD COLUMN IF NOT EXISTS path_slugs TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE educators ADD COLUMN IF NOT EXISTS channel_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS educators_slug_idx ON educators(slug);
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('Video','Playlist')),
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  creator TEXT NOT NULL,
  url TEXT NOT NULL,
  related_slug TEXT,
  review_status TEXT NOT NULL DEFAULT 'Not reviewed'
);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'General';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'Beginner';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS educator_slug TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
CREATE INDEX IF NOT EXISTS catalog_kind_category_idx ON catalog_items(kind, category);
CREATE INDEX IF NOT EXISTS resources_category_idx ON resources(category);

-- Phase 3 adds normalized, account-aware learning records while retaining Phase 1/2 tables.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  auth_provider_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','SUPER_ADMIN')),
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','hi')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  verified_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS one_super_admin ON users(role) WHERE role='SUPER_ADMIN';
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions(user_id);
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('exam','skill')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  estimated_duration TEXT,
  thumbnail_url TEXT,
  outcomes TEXT[] NOT NULL DEFAULT '{}',
  prerequisites TEXT[] NOT NULL DEFAULT '{}',
  modules TEXT[] NOT NULL DEFAULT '{}',
  guidance TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft','Published','Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(kind,slug)
);
CREATE INDEX IF NOT EXISTS courses_status_kind_idx ON courses(status,kind);
ALTER TABLE educators ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Published';
ALTER TABLE educators ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE educators ADD COLUMN IF NOT EXISTS biography TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Published';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS video_id TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS playlist_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS resources_slug_unique ON resources(slug);
CREATE TABLE IF NOT EXISTS roadmaps (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  overview TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft','Published','Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id)
);
CREATE TABLE IF NOT EXISTS roadmap_stages (
  id TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL,
  UNIQUE(roadmap_id,position)
);
CREATE TABLE IF NOT EXISTS roadmap_topics (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES roadmap_stages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  prerequisites TEXT[] NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL,
  UNIQUE(stage_id,position)
);
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL UNIQUE REFERENCES resources(id) ON DELETE CASCADE,
  youtube_playlist_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Published'
);
CREATE TABLE IF NOT EXISTS playlist_videos (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  UNIQUE(playlist_id,position)
);
CREATE TABLE IF NOT EXISTS course_teachers (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  educator_id TEXT NOT NULL REFERENCES educators(id) ON DELETE CASCADE,
  PRIMARY KEY(course_id,educator_id)
);
CREATE TABLE IF NOT EXISTS course_resources (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  PRIMARY KEY(course_id,resource_id)
);
CREATE TABLE IF NOT EXISTS topic_resources (
  topic_id TEXT NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  PRIMARY KEY(topic_id,resource_id)
);
CREATE TABLE IF NOT EXISTS user_saved_courses (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id,course_id)
);
CREATE TABLE IF NOT EXISTS user_saved_roadmaps (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id,roadmap_id)
);
CREATE TABLE IF NOT EXISTS user_bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id,resource_id)
);
CREATE TABLE IF NOT EXISTS user_topic_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id,topic_id)
);
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  last_position_seconds INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id,resource_id)
);
CREATE TABLE IF NOT EXISTS user_learning_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  roadmap_id TEXT REFERENCES roadmaps(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES roadmap_topics(id) ON DELETE SET NULL,
  resource_id TEXT REFERENCES resources(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_learning_activity_user_date_idx ON user_learning_activity(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY,
  content_type TEXT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft','Published','Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_lesson_notes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  video_key TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id, resource_id, video_key)
);
