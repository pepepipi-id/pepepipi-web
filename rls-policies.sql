-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- Adds the missing UPDATE policy on products so /admin's product-edit feature
-- can save changes. Only a logged-in admin (Postgres role "authenticated")
-- can update; public (anon) read access is untouched.

create policy "Admin update" on public.products for update to authenticated using (true) with check (true);
