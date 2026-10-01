-- Website origins allowed to call the assistant (read by the Edge Function at start-up).
-- "https://*.vercel.app" lets Vercel preview and production URLs work before the custom domain is connected.
insert into settings (key, value) values
  ('site', '{"allowed_origins": ["https://proferforge.ca", "https://www.proferforge.ca", "https://*.vercel.app"]}')
on conflict (key) do update set value = excluded.value;
