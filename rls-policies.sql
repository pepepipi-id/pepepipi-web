-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- Adds the missing UPDATE policy on products so /admin's product-edit feature
-- can save changes. Only a logged-in admin (Postgres role "authenticated")
-- can update; public (anon) read access is untouched.

create policy "Admin update" on public.products for update to authenticated using (true) with check (true);

-- Adds the same UPDATE permission for activity_ideas and testimonials, needed
-- for the admin panel's new Publish/Unpublish toggle (draft-by-default workflow).
create policy "Admin update" on public.activity_ideas for update to authenticated using (true) with check (true);
create policy "Admin update" on public.testimonials for update to authenticated using (true) with check (true);
