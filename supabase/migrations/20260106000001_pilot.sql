-- Phase 6 (gratuit) : consentement parental par email, accès parent/enseignant, statistiques, temps de trajet.

-- ---------- Appel d'une Edge Function depuis la base (URL + clé serveur dans le coffre) ----------
create function public.call_edge_function(p_name text, p_body jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_url text; v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_url is null or v_key is null then return; end if;
  perform net.http_post(
    url := v_url || '/functions/v1/' || p_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := p_body
  );
end $$;
revoke execute on function public.call_edge_function(text, jsonb) from public, anon, authenticated;

create or replace function public.dispatch_push() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.push_tokens where profile_id = new.profile_id) then
    perform public.call_edge_function('push', jsonb_build_object('notification_id', new.id));
  end if;
  return new;
end $$;

-- ---------- Consentement parental ----------
-- À l'inscription d'un élève sous le seuil d'âge : email au parent (Edge Function `parent-consent`).
create function public.request_parent_consent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.parental_consent = 'pending' and new.parent_email is not null then
    perform public.call_edge_function('parent-consent', jsonb_build_object('action', 'send', 'student_id', new.profile_id));
  end if;
  return new;
end $$;
create trigger students_parent_consent after insert on public.students
  for each row execute function public.request_parent_consent();

-- ---------- Comptes parent / enseignant ----------
-- Le rôle « parent » (aussi utilisé pour les enseignants) peut être choisi à l'inscription ; il ne donne accès
-- à rien tant qu'un élève ne l'a pas invité.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role;
  v_locale public.app_locale;
  v_birth date;
  v_company uuid;
begin
  v_role := case meta ->> 'role' when 'company_user' then 'company_user' when 'parent' then 'parent' else 'student' end;
  v_locale := case meta ->> 'locale' when 'de' then 'de' else 'fr' end;

  insert into public.profiles (id, role, locale) values (new.id, v_role, v_locale);

  if v_role = 'student' then
    v_birth := (meta ->> 'birth_date')::date;
    insert into public.students (profile_id, first_name, birth_date, commune, parent_email, parental_consent, ai_notice_accepted_at)
    values (
      new.id, meta ->> 'first_name', v_birth, meta ->> 'commune', nullif(meta ->> 'parent_email', ''),
      case when extract(year from age(current_date, v_birth)) < public.min_parent_consent_age()
           then 'pending' else 'not_required' end::public.consent_status,
      now()
    );
  elsif v_role = 'company_user' then
    insert into public.companies (name, ide_number, commune)
    values (meta ->> 'company_name', nullif(meta ->> 'ide_number', ''), meta ->> 'commune')
    returning id into v_company;
    insert into public.company_members (company_id, profile_id, role, contact_name)
    values (v_company, new.id, 'admin', meta ->> 'contact_name');
  end if;
  return new;
end $$;

alter table public.guardians_access
  add column relation text not null default 'parent' check (relation in ('parent', 'teacher')),
  add column accepted_at timestamptz,
  add column expires_at timestamptz not null default now() + interval '14 days';

-- Accès actif : invitation acceptée et non révoquée.
create function public.is_guardian_of(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.guardians_access
    where student_id = p_student and guardian_profile_id = auth.uid() and accepted_at is not null and revoked_at is null
  );
$$;
grant execute on function public.is_guardian_of(uuid) to authenticated;

-- Lecture seule pour le parent/enseignant : profil, candidatures (statuts), rendez-vous, check-ups si partagés.
-- Jamais les messages échangés avec les entreprises, ni les scores.
create policy "élève: lecture parent" on public.students for select to authenticated using (public.is_guardian_of(profile_id));
create policy "candidature: lecture parent" on public.applications for select to authenticated using (public.is_guardian_of(student_id));
create policy "rdv: lecture parent" on public.appointments for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and public.is_guardian_of(a.student_id)));
create policy "créneaux: lecture parent" on public.appointment_slots for select to authenticated
  using (exists (select 1 from public.appointments ap join public.applications a on a.id = ap.application_id
                 where ap.id = appointment_id and public.is_guardian_of(a.student_id)));
create policy "check-up: lecture parent" on public.checkup_reports for select to authenticated
  using (public.is_guardian_of(student_id)
         and exists (select 1 from public.students s where s.profile_id = student_id and s.share_checkups_with_guardians));

-- Le parent voit aussi les annonces concernées par les candidatures qu'il suit.
create or replace view public.listing_cards with (security_barrier = true) as
select
  l.id, l.title, l.description, l.start_date, l.places_count, l.trial_dates, l.status, l.address,
  l.contact_name, l.created_at,
  c.name as company_name,
  p.id as profession_id, p.code as profession_code, p.name_fr as profession_name_fr, p.name_de as profession_name_de,
  m.id as commune_id, m.name as commune_name, m.lat, m.lng,
  l.weights
from public.listings l
join public.companies c on c.id = l.company_id
join public.professions p on p.id = l.profession_id
join public.communes m on m.id = l.commune_id
where c.verified_at is not null
  and (l.status = 'open'
       or exists (select 1 from public.applications a where a.listing_id = l.id
                  and (a.student_id = auth.uid() or public.is_guardian_of(a.student_id))));

-- ---------- Statistiques entreprise ----------
create table public.listing_views (
  listing_id uuid not null references public.listings (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  primary key (listing_id, viewer_id, day)
);
alter table public.listing_views enable row level security;
-- Aucune policy : écriture par record_listing_view, lecture agrégée par listing_stats.

create function public.record_listing_view(p_listing uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.listing_views (listing_id, viewer_id)
  select p_listing, auth.uid()
  where public.listing_is_public(p_listing) and exists (select 1 from public.students where profile_id = auth.uid())
  on conflict do nothing;
$$;
grant execute on function public.record_listing_view(uuid) to authenticated;

create function public.listing_stats(p_listing uuid)
returns table (views int, unique_viewers int, applications int, invited int, offers int, avg_response_hours numeric)
language plpgsql stable security definer set search_path = public as $$
declare v_company uuid;
begin
  select company_id into v_company from public.listings where id = p_listing;
  if v_company is null or not public.is_company_member(v_company) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not public.company_has_feature(v_company, 'stats') then raise exception 'plan_feature_disabled:stats' using errcode = 'P0001'; end if;
  return query
  select
    (select count(*)::int from public.listing_views v where v.listing_id = p_listing),
    (select count(distinct v.viewer_id)::int from public.listing_views v where v.listing_id = p_listing),
    (select count(*)::int from public.applications a where a.listing_id = p_listing),
    (select count(distinct ap.application_id)::int from public.appointments ap join public.applications a on a.id = ap.application_id where a.listing_id = p_listing),
    (select count(*)::int from public.applications a where a.listing_id = p_listing and a.status in ('offer', 'accepted', 'declined')),
    (select round(avg(extract(epoch from (a.first_response_at - a.created_at)) / 3600)::numeric, 1)
     from public.applications a where a.listing_id = p_listing and a.first_response_at is not null);
end $$;
grant execute on function public.listing_stats(uuid) to authenticated;

-- ---------- Temps de trajet en transports publics (cache, API transport.opendata.ch) ----------
-- Gare ou arrêt de référence de chaque commune (identifiants officiels, vérifiés sur transport.opendata.ch).
alter table public.communes add column station_id text, add column station_name text;
update public.communes c set station_id = v.station_id, station_name = v.station_name
from (values
  ('ayent', '8501751', 'Botyre (Ayent), centre'),
  ('brig-glis', '8501609', 'Brig'),
  ('chalais', '8505683', 'Chalais, poste'),
  ('chamoson', '8501504', 'Chamoson-St-Pierre-de-Clages'),
  ('collombey-muraz', '8501422', 'Collombey'),
  ('conthey', '8501510', 'Châteauneuf-Conthey'),
  ('crans-montana', '8579470', 'Crans-Montana, gare'),
  ('fully', '8501274', 'Fully, poste'),
  ('grone', '8588516', 'Grône, écoles'),
  ('leuk', '8501601', 'Leuk'),
  ('martigny', '8501500', 'Martigny'),
  ('monthey', '8501421', 'Monthey'),
  ('naters', '8571163', 'Naters, Marktplatz'),
  ('nendaz', '8501858', 'Haute-Nendaz, station/poste'),
  ('orsieres', '8501578', 'Orsières'),
  ('raron', '8501604', 'Raron'),
  ('riddes', '8501503', 'Riddes'),
  ('saas-fee', '8501782', 'Saas-Fee, Busterminal'),
  ('saint-maurice', '8501403', 'St-Maurice'),
  ('salgesch', '8501600', 'Salgesch'),
  ('saviese', '8501785', 'Savièse, St-Germain centre'),
  ('saxon', '8501502', 'Saxon'),
  ('sierre', '8501509', 'Sierre/Siders'),
  ('sion', '8501506', 'Sion'),
  ('steg-hohtenn', '8501603', 'Gampel-Steg'),
  ('val-de-bagnes', '8501579', 'Le Châble VS'),
  ('vetroz', '8570701', 'Vétroz, poste'),
  ('visp', '8501605', 'Visp'),
  ('vouvry', '8501424', 'Vouvry'),
  ('zermatt', '8501689', 'Zermatt')
) as v(code, station_id, station_name)
where c.code = v.code;

create table public.transit_cache (
  from_commune_id uuid not null references public.communes (id) on delete cascade,
  to_commune_id uuid not null references public.communes (id) on delete cascade,
  minutes int,
  transfers int,
  fetched_at timestamptz not null default now(),
  primary key (from_commune_id, to_commune_id)
);
alter table public.transit_cache enable row level security;
grant select on public.transit_cache to authenticated;
create policy "trajets: lecture" on public.transit_cache for select to authenticated using (true);
