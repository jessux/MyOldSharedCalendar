-- Web Push: abonnements des utilisateurs et rappels d'evenements
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Evite de renvoyer plusieurs fois le rappel d'un meme evenement
alter table events add column if not exists reminder_sent_at timestamptz;

-- Planifie l'envoi des rappels toutes les minutes (necessite pg_cron + pg_net,
-- et les settings app.settings.edge_function_url / app.settings.service_role_key).
-- select cron.schedule(
--   'send-event-reminders',
--   '* * * * *',
--   $$
--   select net.http_post(
--     url := current_setting('app.settings.edge_function_url') || '/send-event-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
