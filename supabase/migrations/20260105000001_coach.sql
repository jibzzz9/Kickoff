-- Phase 4 (gratuit) : métiers visés, suggestions de places, check-ups périodiques par règles.
-- Le chat avec Claude et le simulateur d'entretien seront branchés en fin de projet (payant).

alter table public.students add column target_professions text[] not null default '{}';
grant update (target_professions) on public.students to authenticated;

create function public.distance_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8) returns float8
language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ---------- Suggestions de places (alternatives) ----------
-- Places ouvertes où l'élève n'a pas encore postulé : d'abord ses métiers visés, puis ceux déjà tentés, puis les plus proches.
create function public.suggest_listings_for(p_student uuid, p_limit int default 5)
returns table (listing_id uuid, reason text, distance_km int)
language sql stable security definer set search_path = public as $$
  with me as (
    select s.profile_id, s.target_professions, sc.lat, sc.lng,
           array(select distinct p.code from public.applications a join public.listings l on l.id = a.listing_id
                 join public.professions p on p.id = l.profession_id where a.student_id = s.profile_id) as tried
    from public.students s left join public.communes sc on sc.id = s.commune_id
    where s.profile_id = p_student
  )
  select l.id,
         case when p.code = any(me.target_professions) then 'target_profession'
              when p.code = any(me.tried) then 'same_profession'
              else 'nearby' end,
         case when me.lat is null then null else round(public.distance_km(me.lat, me.lng, m.lat, m.lng))::int end
  from me, public.listings l
  join public.companies c on c.id = l.company_id and c.verified_at is not null
  join public.professions p on p.id = l.profession_id
  join public.communes m on m.id = l.commune_id
  where l.status = 'open'
    and not exists (select 1 from public.applications a where a.listing_id = l.id and a.student_id = me.profile_id)
  order by (p.code = any(me.target_professions)) desc,
           (p.code = any(me.tried)) desc,
           public.distance_km(coalesce(me.lat, m.lat), coalesce(me.lng, m.lng), m.lat, m.lng) asc,
           l.created_at desc
  limit p_limit;
$$;
revoke execute on function public.suggest_listings_for(uuid, int) from public, anon, authenticated;

create function public.suggest_listings(p_limit int default 5)
returns table (listing_id uuid, reason text, distance_km int)
language sql stable security definer set search_path = public as $$
  select * from public.suggest_listings_for(auth.uid(), least(p_limit, 20));
$$;
grant execute on function public.suggest_listings(int) to authenticated;

-- ---------- Check-ups ----------
create table public.checkup_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  content jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.checkup_reports (student_id, created_at desc);

alter table public.students add column share_checkups_with_guardians boolean not null default false;
grant update (share_checkups_with_guardians) on public.students to authenticated;

-- Compte rendu construit par règles à partir de l'activité de la période (gabarits traduits par l'app).
create function public.build_checkup(p_student uuid, p_start timestamptz, p_end timestamptz) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  st record;
  v_stats jsonb;
  v_blocking jsonb := '[]';
  v_working jsonb := '[]';
  v_actions jsonb := '[]';
  v_suggestions jsonb;
  r record;
begin
  select s.*, exists (select 1 from public.student_documents d where d.student_id = s.profile_id and d.kind = 'cv') as has_cv
  into st from public.students s where s.profile_id = p_student;

  select jsonb_build_object(
    'applications', count(*) filter (where a.created_at between p_start and p_end),
    'active', count(*) filter (where a.status not in ('accepted', 'declined', 'not_this_time', 'withdrawn')),
    'follow_ups', (select count(*) from public.messages m join public.applications x on x.id = m.application_id
                   where x.student_id = p_student and m.kind = 'follow_up' and m.created_at between p_start and p_end),
    'invitations', (select count(*) from public.appointments ap join public.applications x on x.id = ap.application_id
                    where x.student_id = p_student and ap.created_at between p_start and p_end),
    'offers', count(*) filter (where a.status in ('offer', 'accepted')),
    'not_this_time', count(*) filter (where a.status = 'not_this_time' and a.decided_at between p_start and p_end)
  ) into v_stats
  from public.applications a where a.student_id = p_student;

  -- Ce qui marche
  if (v_stats ->> 'invitations')::int > 0 then v_working := v_working || jsonb_build_object('key', 'invitations', 'count', (v_stats ->> 'invitations')::int); end if;
  if (v_stats ->> 'offers')::int > 0 then v_working := v_working || jsonb_build_object('key', 'offer'); end if;
  if (v_stats ->> 'applications')::int > 0 then v_working := v_working || jsonb_build_object('key', 'applied', 'count', (v_stats ->> 'applications')::int); end if;

  -- Ce qui bloque : candidatures sans réponse depuis 10 jours
  for r in
    select a.id, c.name, extract(day from now() - a.created_at)::int as days
    from public.applications a join public.listings l on l.id = a.listing_id join public.companies c on c.id = l.company_id
    where a.student_id = p_student and a.status = 'sent' and a.created_at <= now() - interval '10 days'
    order by a.created_at limit 2
  loop
    v_blocking := v_blocking || jsonb_build_object('key', 'no_response', 'company', r.name, 'days', r.days, 'application_id', r.id);
  end loop;
  if not exists (select 1 from public.applications where student_id = p_student) then
    v_blocking := v_blocking || jsonb_build_object('key', 'no_applications');
  end if;
  if (v_stats ->> 'not_this_time')::int > 0 then
    v_blocking := v_blocking || jsonb_build_object('key', 'not_this_time', 'count', (v_stats ->> 'not_this_time')::int);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('listing_id', s.listing_id, 'reason', s.reason, 'distance_km', s.distance_km)), '[]')
  into v_suggestions from public.suggest_listings_for(p_student, 3) s;

  -- 2-3 actions concrètes, par ordre de priorité
  for r in
    select c.name, ap.kind, sl.starts_at from public.appointments ap
    join public.appointment_slots sl on sl.id = ap.chosen_slot_id
    join public.applications a on a.id = ap.application_id join public.listings l on l.id = a.listing_id join public.companies c on c.id = l.company_id
    where a.student_id = p_student and ap.status = 'scheduled' and sl.starts_at between now() and now() + interval '14 days'
    order by sl.starts_at limit 1
  loop
    v_actions := v_actions || jsonb_build_object('key', 'prepare_appointment', 'company', r.name, 'appointment_kind', r.kind, 'starts_at', r.starts_at);
  end loop;
  for r in
    select c.name, a.id from public.applications a join public.listings l on l.id = a.listing_id join public.companies c on c.id = l.company_id
    where a.student_id = p_student and a.status = 'offer' limit 1
  loop
    v_actions := v_actions || jsonb_build_object('key', 'answer_offer', 'company', r.name, 'application_id', r.id);
  end loop;
  if jsonb_array_length(v_blocking) > 0 and v_blocking -> 0 ->> 'key' = 'no_response' then
    v_actions := v_actions || jsonb_build_object('key', 'follow_up', 'company', v_blocking -> 0 ->> 'company', 'application_id', v_blocking -> 0 ->> 'application_id');
  end if;
  if not st.has_cv then v_actions := v_actions || jsonb_build_object('key', 'add_cv'); end if;
  if (v_stats ->> 'applications')::int < 2 and jsonb_array_length(v_suggestions) > 0 then
    v_actions := v_actions || jsonb_build_object('key', 'apply_more', 'count', 2);
  end if;
  if jsonb_array_length(st.trial_internships) = 0 then v_actions := v_actions || jsonb_build_object('key', 'ask_trial'); end if;
  if st.grades ->> 'average' is null then v_actions := v_actions || jsonb_build_object('key', 'complete_profile'); end if;

  return jsonb_build_object(
    'version', 1,
    'stats', v_stats,
    'working', v_working,
    'blocking', v_blocking,
    'suggestions', v_suggestions,
    'actions', (select coalesce(jsonb_agg(x), '[]') from (select x from jsonb_array_elements(v_actions) x limit 3) t)
  );
end $$;
revoke execute on function public.build_checkup(uuid, timestamptz, timestamptz) from public, anon, authenticated;

create function public.generate_checkup(p_student uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_start timestamptz;
  v_id uuid;
begin
  select coalesce(max(period_end), (select created_at from public.students where profile_id = p_student))
  into v_start from public.checkup_reports where student_id = p_student;
  insert into public.checkup_reports (student_id, period_start, period_end, content)
  values (p_student, v_start, now(), public.build_checkup(p_student, v_start, now()))
  returning id into v_id;
  insert into public.notifications (profile_id, type, params) values (p_student, 'checkup_ready', jsonb_build_object('report_id', v_id));
  return v_id;
end $$;
revoke execute on function public.generate_checkup(uuid) from public, anon, authenticated;

-- Tâche quotidienne : un compte rendu pour chaque élève dont la période (7, 14, 21 ou 30 jours) est écoulée.
create function public.generate_due_checkups() returns int
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_count int := 0;
begin
  for r in
    select s.profile_id from public.students s
    where coalesce((select max(c.period_end) from public.checkup_reports c where c.student_id = s.profile_id), s.created_at)
          <= now() - make_interval(days => s.checkup_frequency_days)
  loop
    perform public.generate_checkup(r.profile_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;
revoke execute on function public.generate_due_checkups() from public, anon, authenticated;

-- 17 h, heure suisse (16 h UTC en hiver, 15 h en été) : on vise 16 h UTC.
select cron.schedule('kickoff-checkups', '0 16 * * *', 'select public.generate_due_checkups()');

-- L'élève peut demander son bilan tout de suite (au plus un par jour).
create function public.request_checkup() returns uuid
language plpgsql security definer set search_path = public as $$
declare v_recent uuid;
begin
  if not exists (select 1 from public.students where profile_id = auth.uid()) then raise exception 'not_a_student' using errcode = '42501'; end if;
  select id into v_recent from public.checkup_reports where student_id = auth.uid() and created_at > now() - interval '1 day'
  order by created_at desc limit 1;
  return coalesce(v_recent, public.generate_checkup(auth.uid()));
end $$;
grant execute on function public.request_checkup() to authenticated;

alter table public.checkup_reports enable row level security;
grant select on public.checkup_reports to authenticated;
grant update (read_at) on public.checkup_reports to authenticated;
create policy "check-up: lecture" on public.checkup_reports for select to authenticated using (student_id = auth.uid());
create policy "check-up: lu" on public.checkup_reports for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
