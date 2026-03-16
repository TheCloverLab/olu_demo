-- Specialist Templates — Agent templates for the marketplace
-- A specialist bundles pre-configured skills + instructions into an installable template

create table if not exists specialist_templates (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  icon          text default '🤖',  -- emoji or image URL
  category      text default 'general',
  skills        text[] not null default '{}',
  instructions  text,  -- custom system prompt for the agent
  access_type   text not null default 'free' check (access_type in ('free', 'paid')),
  price         numeric(10,2) default 0,
  currency      text default 'USD',
  install_count integer default 0,
  status        text not null default 'active' check (status in ('active', 'archived')),
  created_by    uuid references users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for marketplace listing
create index if not exists idx_specialist_templates_workspace
  on specialist_templates(workspace_id, status);

create index if not exists idx_specialist_templates_category
  on specialist_templates(category, status);

-- User installs: tracks which users have installed which specialists
create table if not exists specialist_installs (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references specialist_templates(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  project_id    uuid references projects(id) on delete set null, -- the project created from this template
  created_at    timestamptz not null default now(),
  unique(template_id, user_id)
);

-- RLS
alter table specialist_templates enable row level security;
alter table specialist_installs enable row level security;

-- Templates: anyone in workspace can view active ones
create policy "specialist_templates_select"
  on specialist_templates for select
  using (
    status = 'active'
    or created_by = auth.uid()
  );

-- Templates: workspace members can create
create policy "specialist_templates_insert"
  on specialist_templates for insert
  with check (
    exists (
      select 1 from workspace_memberships
      where workspace_id = specialist_templates.workspace_id
      and user_id = auth.uid()
    )
  );

-- Templates: creator can update
create policy "specialist_templates_update"
  on specialist_templates for update
  using (created_by = auth.uid());

-- Templates: creator can delete
create policy "specialist_templates_delete"
  on specialist_templates for delete
  using (created_by = auth.uid());

-- Installs: users can view their own
create policy "specialist_installs_select"
  on specialist_installs for select
  using (user_id = auth.uid());

-- Installs: users can insert their own
create policy "specialist_installs_insert"
  on specialist_installs for insert
  with check (user_id = auth.uid());

-- Helper RPC to increment install count
create or replace function increment_specialist_installs(tid uuid)
returns void language sql security definer as $$
  update specialist_templates
  set install_count = install_count + 1
  where id = tid;
$$;

-- Seed demo specialist templates
insert into specialist_templates (id, workspace_id, name, description, icon, category, skills, instructions, access_type, price, created_by)
select
  t.id::uuid,
  w.id,
  t.name,
  t.description,
  t.icon,
  t.category,
  t.skills::text[],
  t.instructions,
  t.access_type,
  t.price,
  (select id from users limit 1)
from (values
  ('00000000-0000-0000-0000-000000000101',
   'Social Media Manager',
   'Manages your social media presence — posting, analytics, and engagement across platforms.',
   '📱', 'marketing',
   '{social,content,web,memory}',
   'You are a Social Media Manager specialist. Focus on growing social media presence, creating engaging content, scheduling posts, and analyzing engagement metrics. Always suggest content ideas based on trending topics.',
   'free', 0),
  ('00000000-0000-0000-0000-000000000102',
   'Content Creator',
   'Generates blog posts, newsletters, images, and marketing copy.',
   '✍️', 'content',
   '{content,web,code,memory}',
   'You are a Content Creator specialist. Focus on producing high-quality written content, generating images, and creating documents. Always maintain brand voice consistency.',
   'free', 0),
  ('00000000-0000-0000-0000-000000000103',
   'Marketing Analyst',
   'Runs ad campaigns, tracks performance, and optimizes marketing spend.',
   '📊', 'marketing',
   '{marketing,web,budget,memory,automation}',
   'You are a Marketing Analyst specialist. Focus on running and optimizing ad campaigns, analyzing ROI, and providing data-driven recommendations. Always track budget carefully.',
   'paid', 9.99),
  ('00000000-0000-0000-0000-000000000104',
   'Customer Support Agent',
   'Handles customer inquiries with product knowledge and empathy.',
   '🎧', 'support',
   '{support,communication,memory,web}',
   'You are a Customer Support specialist. Focus on resolving customer issues quickly and empathetically. Use the knowledge base to provide accurate answers. Escalate complex issues to human agents.',
   'free', 0),
  ('00000000-0000-0000-0000-000000000105',
   'Research Assistant',
   'Deep web research, data collection, and report generation.',
   '🔬', 'research',
   '{web,content,code,memory}',
   'You are a Research Assistant specialist. Focus on thorough web research, data collection, fact-checking, and producing well-structured research reports with citations.',
   'free', 0),
  ('00000000-0000-0000-0000-000000000106',
   'Lark Operations',
   'Manages Lark tasks, calendar, and Bitable databases for team operations.',
   '🦅', 'operations',
   '{lark-suite,workspace-core,automation,memory}',
   'You are a Lark Operations specialist. Focus on managing team tasks in Lark, scheduling meetings, and maintaining Bitable databases. Keep the team organized and on track.',
   'paid', 4.99)
) as t(id, name, description, icon, category, skills, instructions, access_type, price)
cross join (select id from workspaces limit 1) w
on conflict (id) do nothing;
