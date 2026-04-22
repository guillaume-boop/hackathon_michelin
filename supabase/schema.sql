-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text not null,
  password_hash text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'chef', 'admin')),
  circle_score integer not null default 0,
  created_at timestamptz not null default now()
);

-- Restaurants
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  michelin_stars smallint not null default 0 check (michelin_stars between 0 and 3),
  green_stars boolean not null default false,
  dietary_option text check (dietary_option in ('vegan', 'veggie')),
  city text not null,
  country text not null,
  lat double precision not null default 0,
  lng double precision not null default 0,
  description text,
  created_at timestamptz not null default now()
);

-- Experiences
create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  note text,
  media_urls text[] not null default '{}',
  visited_at timestamptz not null default now()
);

-- Feed posts
create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  type text not null check (type in ('video', 'review', 'checkin')),
  content_url text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Feed likes (deduplicated)
create table if not exists feed_likes (
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Feed bookmarks
create table if not exists feed_bookmarks (
  post_id   uuid not null references feed_posts(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Follows
create table if not exists follows (
  follower_id uuid not null references users(id) on delete cascade,
  followee_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id != followee_id)
);

-- User locations (upserted, one row per user)
create table if not exists user_locations (
  user_id uuid primary key references users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

-- Circles
create table if not exists circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Circle members
create table if not exists circle_members (
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  primary key (circle_id, user_id)
);

-- Circle memories
create table if not exists circle_memories (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (circle_id, experience_id)
);

-- Restaurant videos
create table if not exists restaurant_videos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  url text not null,
  title text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

-- Chef profiles (one per user, linked to a restaurant)
create table if not exists chef_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  bio text,
  video_url text,
  created_at timestamptz not null default now()
);

-- Chef signature dishes
create table if not exists chef_signature_dishes (
  id uuid primary key default gen_random_uuid(),
  chef_profile_id uuid not null references chef_profiles(id) on delete cascade,
  name text not null,
  description text,
  photo_url text,
  "order" integer not null default 0
);

-- Indexes for common lookups
create index if not exists idx_experiences_user_id on experiences(user_id);
create index if not exists idx_experiences_restaurant_id on experiences(restaurant_id);
create index if not exists idx_feed_posts_user_id on feed_posts(user_id);
create index if not exists idx_feed_posts_created_at on feed_posts(created_at desc);
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_followee on follows(followee_id);
create index if not exists idx_circle_members_user on circle_members(user_id);
