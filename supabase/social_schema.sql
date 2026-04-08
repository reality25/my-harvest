-- ============================================================
-- Harvest: Social Layer Migration  (idempotent)
-- Run this entire file in the Supabase SQL editor once.
-- ============================================================


-- ─── 1. Storage bucket for post media ─────────────────────
-- Object paths must follow: "<user_id>/<filename>" (enforced by app)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media', 'post-media', true,
  10485760,
  array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm']
) on conflict (id) do nothing;

drop policy if exists "Public can view post media"        on storage.objects;
drop policy if exists "Auth users can upload post media"  on storage.objects;
drop policy if exists "Users delete own post media"       on storage.objects;

create policy "Public can view post media"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "Auth users can upload post media"
  on storage.objects for insert
  with check (bucket_id = 'post-media' and auth.uid() is not null);

-- Upload path = "<uid>/<filename>", so foldername[1] == uid
create policy "Users delete own post media"
  on storage.objects for delete
  using (bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]);


-- ─── 2. Communities ────────────────────────────────────────
create table if not exists public.communities (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  description  text,
  image_url    text,
  creator_id   uuid        references public.profiles(id) on delete cascade not null,
  member_count integer     default 1 not null check (member_count >= 0),
  created_at   timestamptz default now() not null
);

alter table public.communities enable row level security;

drop policy if exists "Communities are public"    on public.communities;
drop policy if exists "Users create communities"  on public.communities;
drop policy if exists "Creators update communities" on public.communities;
drop policy if exists "Creators delete communities" on public.communities;

create policy "Communities are public"
  on public.communities for select using (true);
create policy "Users create communities"
  on public.communities for insert with check (auth.uid() = creator_id);
create policy "Creators update communities"
  on public.communities for update using (auth.uid() = creator_id);
create policy "Creators delete communities"
  on public.communities for delete using (auth.uid() = creator_id);


-- ─── 3. Community members ──────────────────────────────────
create table if not exists public.community_members (
  community_id uuid        references public.communities(id) on delete cascade not null,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  joined_at    timestamptz default now() not null,
  primary key (community_id, user_id)
);

alter table public.community_members enable row level security;

drop policy if exists "Members are public"     on public.community_members;
drop policy if exists "Users join communities" on public.community_members;
drop policy if exists "Users leave communities" on public.community_members;

create policy "Members are public"
  on public.community_members for select using (true);
create policy "Users join communities"
  on public.community_members for insert with check (auth.uid() = user_id);
create policy "Users leave communities"
  on public.community_members for delete using (auth.uid() = user_id);

create index if not exists idx_community_members_user_id
  on public.community_members (user_id);


-- ─── 4. Posts ──────────────────────────────────────────────
create table if not exists public.posts (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references public.profiles(id) on delete cascade not null,
  text             text        not null default '',
  image_url        text,
  video_url        text,
  tag              text        not null default 'Discussion',
  community_id     uuid        references public.communities(id) on delete set null,
  original_post_id uuid        references public.posts(id) on delete set null,
  like_count       integer     not null default 0 check (like_count >= 0),
  dislike_count    integer     not null default 0 check (dislike_count >= 0),
  comment_count    integer     not null default 0 check (comment_count >= 0),
  created_at       timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "Posts are public"      on public.posts;
drop policy if exists "Users create own posts" on public.posts;
drop policy if exists "Users delete own posts" on public.posts;

create policy "Posts are public"
  on public.posts for select using (true);
create policy "Users create own posts"
  on public.posts for insert with check (auth.uid() = user_id);
create policy "Users delete own posts"
  on public.posts for delete using (auth.uid() = user_id);
-- NOTE: no UPDATE policy for app code — only triggers (security definer) update counts

create index if not exists idx_posts_user_id
  on public.posts (user_id);
create index if not exists idx_posts_community_id
  on public.posts (community_id);
create index if not exists idx_posts_original_post_id
  on public.posts (original_post_id);
create index if not exists idx_posts_created_at
  on public.posts (created_at desc);


-- ─── 5. Post reactions ─────────────────────────────────────
create table if not exists public.post_reactions (
  post_id    uuid        references public.posts(id) on delete cascade not null,
  user_id    uuid        references public.profiles(id) on delete cascade not null,
  type       text        not null check (type in ('like','dislike')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_reactions enable row level security;

drop policy if exists "Reactions are public"      on public.post_reactions;
drop policy if exists "Users add reactions"        on public.post_reactions;
drop policy if exists "Users update own reactions" on public.post_reactions;
drop policy if exists "Users delete own reactions" on public.post_reactions;

create policy "Reactions are public"
  on public.post_reactions for select using (true);
create policy "Users add reactions"
  on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "Users update own reactions"
  on public.post_reactions for update using (auth.uid() = user_id);
create policy "Users delete own reactions"
  on public.post_reactions for delete using (auth.uid() = user_id);

create index if not exists idx_post_reactions_user_id
  on public.post_reactions (user_id);


-- ─── 6. Post comments ──────────────────────────────────────
create table if not exists public.post_comments (
  id                uuid        primary key default gen_random_uuid(),
  post_id           uuid        references public.posts(id) on delete cascade not null,
  user_id           uuid        references public.profiles(id) on delete cascade not null,
  text              text        not null,
  parent_comment_id uuid        references public.post_comments(id) on delete cascade,
  created_at        timestamptz not null default now()
);

alter table public.post_comments enable row level security;

drop policy if exists "Comments are public"       on public.post_comments;
drop policy if exists "Users add comments"         on public.post_comments;
drop policy if exists "Users delete own comments"  on public.post_comments;

create policy "Comments are public"
  on public.post_comments for select using (true);
create policy "Users add comments"
  on public.post_comments for insert with check (auth.uid() = user_id);
create policy "Users delete own comments"
  on public.post_comments for delete using (auth.uid() = user_id);

create index if not exists idx_post_comments_post_id
  on public.post_comments (post_id);
create index if not exists idx_post_comments_user_id
  on public.post_comments (user_id);


-- ─── 7. Trigger: auto-update reaction counts ───────────────
create or replace function public.handle_reaction_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    if new.type = 'like' then
      update public.posts set like_count = like_count + 1 where id = new.post_id;
    else
      update public.posts set dislike_count = dislike_count + 1 where id = new.post_id;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.type = 'like' then
      update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    else
      update public.posts set dislike_count = greatest(dislike_count - 1, 0) where id = old.post_id;
    end if;
    return old;
  end if;

  -- UPDATE: skip if type unchanged
  if old.type = new.type then
    return new;
  end if;

  if new.type = 'like' then
    update public.posts
      set like_count = like_count + 1,
          dislike_count = greatest(dislike_count - 1, 0)
      where id = new.post_id;
  else
    update public.posts
      set dislike_count = dislike_count + 1,
          like_count = greatest(like_count - 1, 0)
      where id = new.post_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reaction_count on public.post_reactions;
create trigger trg_reaction_count
  after insert or update or delete on public.post_reactions
  for each row execute function public.handle_reaction_count();


-- ─── 8. Trigger: auto-update comment count ─────────────────
create or replace function public.handle_comment_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_comment_count on public.post_comments;
create trigger trg_comment_count
  after insert or delete on public.post_comments
  for each row execute function public.handle_comment_count();


-- ─── 9. Trigger: auto-update community member count ────────
create or replace function public.handle_member_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = new.community_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.communities set member_count = greatest(member_count - 1, 0) where id = old.community_id;
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_member_count on public.community_members;
create trigger trg_member_count
  after insert or delete on public.community_members
  for each row execute function public.handle_member_count();
