-- Create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  logo_url text,
  primary_color text,
  secondary_color text,
  wp_url text,
  wp_username text,
  wp_app_password text -- encrpytion recommended for production
);

-- Create articles table
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  keyword text not null,
  title text,
  content_html text,
  status text default 'draft', -- draft, published
  image_url text
);

-- Enable RLS
alter table public.clients enable row level security;
alter table public.articles enable row level security;

-- Create policies (Allow all for authenticated users - Simplest for MVP)
-- Drop existing policies if any to avoid errors on re-run
drop policy if exists "Allow all for authenticated users" on public.clients;
create policy "Allow all for authenticated users" on public.clients
  for all using (auth.role() = 'authenticated');

drop policy if exists "Allow all for authenticated users" on public.articles;
create policy "Allow all for authenticated users" on public.articles
  for all using (auth.role() = 'authenticated');
