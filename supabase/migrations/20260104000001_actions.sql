-- Phase 3 : entretiens et stages d'essai, décisions, messages, notifications, rappels.
-- Toutes les actions passent par des fonctions SQL qui vérifient les droits et font tout d'un coup
-- (statut + message + notification). Aucune décision n'est prise automatiquement par le score.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create type public.appointment_kind as enum ('interview', 'trial');
create type public.appointment_status as enum ('proposed', 'scheduled', 'done', 'cancelled');

alter table public.applications
  add column first_response_at timestamptz,
  add column decided_at timestamptz;

-- L'élève choisit s'il veut recevoir les retours de stage d'essai des entreprises.
alter table public.students add column share_trial_feedback boolean not null default false;
grant update (share_trial_feedback) on public.students to authenticated;

-- ---------- Rendez-vous (entretien ou stage d'essai) ----------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  kind public.appointment_kind not null,
  status public.appointment_status not null default 'proposed',
  location text,
  contact_person text,
  what_to_bring text,
  duration_minutes int not null default 60 check (duration_minutes between 15 and 600),
  chosen_slot_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.appointments (application_id);

create table public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  starts_at timestamptz not null
);
create index on public.appointment_slots (appointment_id);
alter table public.appointments
  add constraint appointments_chosen_slot_fk foreign key (chosen_slot_id) references public.appointment_slots (id) on delete set null;

create table public.trial_evaluations (
  appointment_id uuid primary key references public.appointments (id) on delete cascade,
  punctuality int not null check (punctuality between 1 and 4),
  interest int not null check (interest between 1 and 4),
  team_contact int not null check (team_contact between 1 and 4),
  comment text check (char_length(comment) <= 2000),
  share_with_student boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.recruiter_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.recruiter_notes (application_id);

-- ---------- Fil de messages lié à une candidature ----------
-- Chaque événement (invitation, choix de créneau, décision…) est un message : c'est l'historique du jeune et de l'entreprise.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_role text not null check (sender_role in ('company', 'student', 'system')),
  sender_id uuid references public.profiles (id) on delete set null,
  kind text not null default 'text' check (kind in (
    'text', 'invitation', 'slot_chosen', 'offer', 'offer_accepted', 'offer_declined',
    'not_this_time', 'waitlist', 'filled', 'follow_up', 'withdrawn', 'trial_feedback'
  )),
  body text check (char_length(body) <= 5000),
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.messages (application_id, created_at);

-- ---------- Notifications (in-app + push) ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  params jsonb not null default '{}',
  read_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (profile_id, created_at desc);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now()
);

-- Rappels déjà envoyés (évite les doublons).
create table public.reminders (
  id bigint generated always as identity primary key,
  kind text not null,
  application_id uuid references public.applications (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (kind, application_id, appointment_id)
);

-- ---------- Fonctions utilitaires ----------
create function public.application_context(p_application uuid)
returns table (student_id uuid, listing_id uuid, company_id uuid, company_name text, listing_title text,
               first_name text, places_count int, status public.application_status)
language sql stable security definer set search_path = public as $$
  select a.student_id, a.listing_id, l.company_id, c.name, l.title, s.first_name, l.places_count, a.status
  from public.applications a
  join public.listings l on l.id = a.listing_id
  join public.companies c on c.id = l.company_id
  join public.students s on s.profile_id = a.student_id
  where a.id = p_application;
$$;

create function public.assert_company_action(p_application uuid, p_feature text) returns void
language plpgsql stable security definer set search_path = public as $$
declare v_company uuid;
begin
  select l.company_id into v_company from public.applications a join public.listings l on l.id = a.listing_id where a.id = p_application;
  if v_company is null or not public.is_company_member(v_company) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not public.company_has_feature(v_company, p_feature) then
    raise exception 'plan_feature_disabled:%', p_feature using errcode = 'P0001';
  end if;
end $$;

create function public.assert_student_owns(p_application uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.applications where id = p_application and student_id = auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
end $$;

-- Message système/entreprise/élève + notification(s) au(x) destinataire(s) (trigger ci-dessous).
create function public.post_message(p_application uuid, p_role text, p_kind text, p_body text, p_appointment uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.messages (application_id, sender_role, sender_id, kind, body, appointment_id)
  values (p_application, p_role, case when p_role = 'system' then null else auth.uid() end, p_kind, nullif(trim(p_body), ''), p_appointment)
  returning id into v_id;
  return v_id;
end $$;

-- ---------- Notifications automatiques à partir des messages ----------
create function public.notify_from_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_type text := case new.kind when 'text' then 'new_message' else new.kind end;
  v_params jsonb;
begin
  select * into ctx from public.application_context(new.application_id);
  v_params := jsonb_build_object(
    'application_id', new.application_id, 'company', ctx.company_name, 'listing', ctx.listing_title,
    'first_name', ctx.first_name,
    'appointment_kind', (select kind from public.appointments where id = new.appointment_id)
  );
  if new.sender_role in ('company', 'system') then
    insert into public.notifications (profile_id, type, params) values (ctx.student_id, v_type, v_params);
  else
    insert into public.notifications (profile_id, type, params)
    select cm.profile_id, v_type, v_params from public.company_members cm where cm.company_id = ctx.company_id;
  end if;
  return new;
end $$;
create trigger messages_notify after insert on public.messages for each row execute function public.notify_from_message();

create function public.notify_new_application() returns trigger
language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  select * into ctx from public.application_context(new.id);
  insert into public.notifications (profile_id, type, params)
  select cm.profile_id, 'new_application',
         jsonb_build_object('application_id', new.id, 'listing', ctx.listing_title, 'first_name', ctx.first_name, 'listing_id', new.listing_id)
  from public.company_members cm where cm.company_id = ctx.company_id;
  return new;
end $$;
create trigger applications_notify after insert on public.applications for each row execute function public.notify_new_application();

-- Push : appelle l'Edge Function `push` si le destinataire a un appareil enregistré
-- et si l'URL du projet + la clé serveur sont dans le coffre (vault). Sinon, notification in-app seulement.
create function public.dispatch_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_key text;
begin
  if not exists (select 1 from public.push_tokens where profile_id = new.profile_id) then return new; end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_url is null or v_key is null then return new; end if;
  perform net.http_post(
    url := v_url || '/functions/v1/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('notification_id', new.id)
  );
  return new;
end $$;
create trigger notifications_push after insert on public.notifications for each row execute function public.dispatch_push();

-- ---------- Actions entreprise ----------

-- Invitation (entretien ou stage d'essai), possible pour plusieurs candidats d'un coup.
create function public.company_invite(
  p_application_ids uuid[], p_kind public.appointment_kind, p_message text, p_slots timestamptz[],
  p_location text default null, p_contact_person text default null, p_what_to_bring text default null,
  p_duration_minutes int default 60
) returns int language plpgsql security definer set search_path = public as $$
declare
  v_app uuid;
  v_appointment uuid;
  v_slot timestamptz;
  v_count int := 0;
begin
  if coalesce(array_length(p_slots, 1), 0) not between 1 and 5 then raise exception 'slots_count' using errcode = '22023'; end if;
  if exists (select 1 from unnest(p_slots) s where s < now()) then raise exception 'slot_in_past' using errcode = '22023'; end if;
  if char_length(coalesce(p_message, '')) > 3000 then raise exception 'message_too_long' using errcode = '22023'; end if;

  foreach v_app in array p_application_ids loop
    perform public.assert_company_action(v_app, case p_kind when 'trial' then 'trial_management' else 'one_click_actions' end);
    if (select status from public.applications where id = v_app) in ('accepted', 'declined', 'withdrawn') then continue; end if;

    insert into public.appointments (application_id, kind, location, contact_person, what_to_bring, duration_minutes, created_by)
    values (v_app, p_kind, p_location, p_contact_person, p_what_to_bring, p_duration_minutes, auth.uid())
    returning id into v_appointment;
    foreach v_slot in array p_slots loop
      insert into public.appointment_slots (appointment_id, starts_at) values (v_appointment, v_slot);
    end loop;

    update public.applications
    set status = case when status in ('offer') then status else p_kind::text::public.application_status end,
        first_response_at = coalesce(first_response_at, now()), updated_at = now()
    where id = v_app;
    perform public.post_message(v_app, 'company', 'invitation', p_message, v_appointment);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- Décision humaine : proposer la place, pas cette fois, liste d'attente.
create function public.company_decide(p_application uuid, p_decision text, p_message text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_decision not in ('offer', 'not_this_time', 'waitlist') then raise exception 'bad_decision' using errcode = '22023'; end if;
  perform public.assert_company_action(p_application, 'one_click_actions');
  if (select status from public.applications where id = p_application) in ('accepted', 'declined', 'withdrawn') then
    raise exception 'application_closed' using errcode = 'P0001';
  end if;
  update public.applications
  set status = p_decision::public.application_status, decided_at = now(),
      first_response_at = coalesce(first_response_at, now()), updated_at = now()
  where id = p_application;
  if p_decision = 'not_this_time' then
    update public.appointments set status = 'cancelled', updated_at = now()
    where application_id = p_application and status in ('proposed', 'scheduled');
  end if;
  perform public.post_message(p_application, 'company', p_decision, p_message);
end $$;

-- Fiche d'évaluation du stage d'essai.
create function public.company_evaluate_trial(
  p_appointment uuid, p_punctuality int, p_interest int, p_team_contact int, p_comment text, p_share boolean
) returns void language plpgsql security definer set search_path = public as $$
declare v_app uuid;
begin
  select application_id into v_app from public.appointments where id = p_appointment and kind = 'trial';
  if v_app is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform public.assert_company_action(v_app, 'trial_management');
  insert into public.trial_evaluations (appointment_id, punctuality, interest, team_contact, comment, share_with_student, created_by)
  values (p_appointment, p_punctuality, p_interest, p_team_contact, nullif(trim(p_comment), ''), p_share, auth.uid())
  on conflict (appointment_id) do update set punctuality = excluded.punctuality, interest = excluded.interest,
    team_contact = excluded.team_contact, comment = excluded.comment, share_with_student = excluded.share_with_student;
  update public.appointments set status = 'done', updated_at = now() where id = p_appointment;
  -- Le jeune n'est prévenu que si l'entreprise partage ET s'il a accepté de recevoir les retours.
  if p_share and (select s.share_trial_feedback from public.applications a join public.students s on s.profile_id = a.student_id where a.id = v_app) then
    perform public.post_message(v_app, 'system', 'trial_feedback', null, p_appointment);
  end if;
end $$;

-- Place pourvue : ferme l'annonce et répond poliment à tous les candidats encore en attente.
-- Déclenché uniquement par une action humaine (acceptation d'une offre ou clic « Place pourvue »).
create function public.fill_listing(p_listing uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_app uuid;
begin
  update public.listings set status = 'filled', updated_at = now() where id = p_listing and status = 'open';
  for v_app in
    select id from public.applications
    where listing_id = p_listing and status not in ('accepted', 'declined', 'not_this_time', 'withdrawn')
  loop
    update public.applications set status = 'not_this_time', decided_at = now(), updated_at = now() where id = v_app;
    update public.appointments set status = 'cancelled', updated_at = now()
    where application_id = v_app and status in ('proposed', 'scheduled');
    perform public.post_message(v_app, 'system', 'filled', null);
  end loop;
end $$;

create function public.company_mark_filled(p_listing uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_listing_company_member(p_listing) then raise exception 'not_allowed' using errcode = '42501'; end if;
  perform public.fill_listing(p_listing);
end $$;

-- ---------- Actions élève ----------
create function public.student_choose_slot(p_appointment uuid, p_slot uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_app uuid;
begin
  select a.application_id into v_app from public.appointments a
  join public.appointment_slots s on s.appointment_id = a.id and s.id = p_slot
  where a.id = p_appointment and a.status in ('proposed', 'scheduled');
  if v_app is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform public.assert_student_owns(v_app);
  update public.appointments set chosen_slot_id = p_slot, status = 'scheduled', updated_at = now() where id = p_appointment;
  perform public.post_message(v_app, 'student', 'slot_chosen', null, p_appointment);
end $$;

create function public.student_respond_offer(p_application uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  perform public.assert_student_owns(p_application);
  select * into ctx from public.application_context(p_application);
  if ctx.status <> 'offer' then raise exception 'no_offer' using errcode = 'P0001'; end if;
  update public.applications set status = case when p_accept then 'accepted' else 'declined' end::public.application_status, updated_at = now()
  where id = p_application;
  perform public.post_message(p_application, 'student', case when p_accept then 'offer_accepted' else 'offer_declined' end, null);
  if p_accept and (select count(*) from public.applications where listing_id = ctx.listing_id and status = 'accepted') >= ctx.places_count then
    perform public.fill_listing(ctx.listing_id);
  end if;
end $$;

create function public.student_follow_up(p_application uuid, p_message text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_student_owns(p_application);
  if (select status from public.applications where id = p_application) <> 'sent' then
    raise exception 'cannot_follow_up' using errcode = 'P0001';
  end if;
  update public.applications set status = 'followed_up', updated_at = now() where id = p_application;
  perform public.post_message(p_application, 'student', 'follow_up', left(p_message, 2000));
end $$;

create function public.student_withdraw(p_application uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_student_owns(p_application);
  update public.applications set status = 'withdrawn', updated_at = now()
  where id = p_application and status not in ('accepted', 'withdrawn');
  update public.appointments set status = 'cancelled', updated_at = now()
  where application_id = p_application and status in ('proposed', 'scheduled');
  perform public.post_message(p_application, 'student', 'withdrawn', null);
end $$;

-- Fonctions internes : jamais appelables directement depuis le client.
revoke execute on function public.post_message(uuid, text, text, text, uuid), public.fill_listing(uuid),
  public.application_context(uuid), public.assert_company_action(uuid, text), public.assert_student_owns(uuid)
  from public, anon, authenticated;
grant execute on function public.company_invite(uuid[], public.appointment_kind, text, timestamptz[], text, text, text, int),
  public.company_decide(uuid, text, text), public.company_evaluate_trial(uuid, int, int, int, text, boolean),
  public.company_mark_filled(uuid), public.student_choose_slot(uuid, uuid), public.student_respond_offer(uuid, boolean),
  public.student_follow_up(uuid, text), public.student_withdraw(uuid) to authenticated;

-- ---------- Rappels automatiques (pg_cron toutes les 15 minutes) ----------
create function public.run_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_count int := 0;
  v_local_now timestamp := now() at time zone 'Europe/Zurich';
begin
  -- Relance : candidature envoyée il y a au moins 10 jours, sans réponse.
  for r in
    select a.id, a.student_id, c.name as company, l.title as listing
    from public.applications a join public.listings l on l.id = a.listing_id join public.companies c on c.id = l.company_id
    where a.status = 'sent' and a.created_at <= now() - interval '10 days'
      and not exists (select 1 from public.reminders x where x.kind = 'follow_up' and x.application_id = a.id)
  loop
    insert into public.reminders (kind, application_id) values ('follow_up', r.id);
    insert into public.notifications (profile_id, type, params)
    values (r.student_id, 'follow_up_reminder', jsonb_build_object('application_id', r.id, 'company', r.company, 'listing', r.listing, 'days', 10));
    v_count := v_count + 1;
  end loop;

  -- Rendez-vous : la veille (à partir de 17 h) et le matin même (à partir de 7 h), heure suisse.
  for r in
    select ap.id, ap.application_id, ap.kind, ap.location, sl.starts_at, a.student_id, c.name as company,
           (sl.starts_at at time zone 'Europe/Zurich')::date as day
    from public.appointments ap
    join public.appointment_slots sl on sl.id = ap.chosen_slot_id
    join public.applications a on a.id = ap.application_id
    join public.listings l on l.id = a.listing_id join public.companies c on c.id = l.company_id
    where ap.status = 'scheduled' and sl.starts_at > now()
  loop
    if r.day = v_local_now::date + 1 and extract(hour from v_local_now) >= 17
       and not exists (select 1 from public.reminders x where x.kind = 'day_before' and x.appointment_id = r.id) then
      insert into public.reminders (kind, appointment_id) values ('day_before', r.id);
      insert into public.notifications (profile_id, type, params)
      values (r.student_id, 'appointment_reminder', jsonb_build_object('application_id', r.application_id, 'appointment_id', r.id,
        'when', 'tomorrow', 'appointment_kind', r.kind, 'company', r.company, 'location', r.location, 'starts_at', r.starts_at));
      v_count := v_count + 1;
    elsif r.day = v_local_now::date and extract(hour from v_local_now) >= 7
       and not exists (select 1 from public.reminders x where x.kind = 'same_day' and x.appointment_id = r.id) then
      insert into public.reminders (kind, appointment_id) values ('same_day', r.id);
      insert into public.notifications (profile_id, type, params)
      values (r.student_id, 'appointment_reminder', jsonb_build_object('application_id', r.application_id, 'appointment_id', r.id,
        'when', 'today', 'appointment_kind', r.kind, 'company', r.company, 'location', r.location, 'starts_at', r.starts_at));
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end $$;
revoke execute on function public.run_reminders() from public, anon, authenticated;

select cron.schedule('kickoff-reminders', '*/15 * * * *', 'select public.run_reminders()');

-- ---------- RLS ----------
alter table public.appointments enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.trial_evaluations enable row level security;
alter table public.recruiter_notes enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
alter table public.reminders enable row level security;

create function public.can_see_application(p_application uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.applications where id = p_application and student_id = auth.uid())
      or public.is_application_company_member(p_application);
$$;
grant execute on function public.can_see_application(uuid) to authenticated;

-- Rendez-vous et créneaux : lisibles par l'élève concerné et l'entreprise ; écriture via les fonctions ci-dessus.
grant select on public.appointments, public.appointment_slots to authenticated;
create policy "rdv: lecture" on public.appointments for select to authenticated using (public.can_see_application(application_id));
create policy "créneaux: lecture" on public.appointment_slots for select to authenticated
  using (exists (select 1 from public.appointments a where a.id = appointment_id and public.can_see_application(a.application_id)));

-- Évaluation de stage : l'entreprise la voit ; l'élève seulement si elle est partagée ET s'il l'a accepté.
grant select on public.trial_evaluations to authenticated;
create policy "évaluation: lecture entreprise" on public.trial_evaluations for select to authenticated
  using (exists (select 1 from public.appointments a where a.id = appointment_id and public.is_application_company_member(a.application_id)));
create policy "évaluation: lecture élève" on public.trial_evaluations for select to authenticated
  using (share_with_student and exists (
    select 1 from public.appointments a join public.applications ap on ap.id = a.application_id
    join public.students s on s.profile_id = ap.student_id
    where a.id = appointment_id and ap.student_id = auth.uid() and s.share_trial_feedback));

-- Notes privées du formateur : jamais visibles par l'élève.
grant select, insert, delete on public.recruiter_notes to authenticated;
create policy "notes: lecture" on public.recruiter_notes for select to authenticated
  using (public.is_application_company_member(application_id));
create policy "notes: ajout" on public.recruiter_notes for insert to authenticated
  with check (author_id = auth.uid() and public.is_application_company_member(application_id));
create policy "notes: suppression" on public.recruiter_notes for delete to authenticated
  using (author_id = auth.uid());

-- Messages : les deux parties lisent ; chacune peut écrire un message libre (kind 'text') dans son rôle.
grant select, insert on public.messages to authenticated;
create policy "messages: lecture" on public.messages for select to authenticated using (public.can_see_application(application_id));
create policy "messages: envoi" on public.messages for insert to authenticated
  with check (
    kind = 'text' and sender_id = auth.uid() and appointment_id is null and char_length(coalesce(body, '')) between 1 and 5000
    and (
      (sender_role = 'student' and exists (select 1 from public.applications a where a.id = application_id and a.student_id = auth.uid()))
      or (sender_role = 'company' and public.is_application_company_member(application_id))
    )
  );

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "notifications: lecture" on public.notifications for select to authenticated using (profile_id = auth.uid());
create policy "notifications: lu" on public.notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select, insert, delete on public.push_tokens to authenticated;
create policy "push: lecture" on public.push_tokens for select to authenticated using (profile_id = auth.uid());
create policy "push: ajout" on public.push_tokens for insert to authenticated with check (profile_id = auth.uid());
create policy "push: suppression" on public.push_tokens for delete to authenticated using (profile_id = auth.uid());
-- reminders : aucune policy (serveur uniquement).

-- ---------- Temps réel ----------
alter publication supabase_realtime add table public.appointments, public.messages, public.notifications;

