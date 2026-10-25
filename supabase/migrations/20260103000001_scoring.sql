-- Phase 2 : scores de compatibilité (calculés par l'Edge Function `match`, jamais par le client).

create table public.match_scores (
  application_id uuid primary key references public.applications (id) on delete cascade,
  score int not null check (score between 0 and 100),
  segments int not null check (segments between 0 and 5),
  badge text not null check (badge in ('very_interesting', 'interesting', 'to_discover', 'incomplete')),
  details jsonb not null,
  algo_version text not null,
  inputs_hash text not null,
  computed_at timestamptz not null default now()
);

-- Journal : chaque nouveau résultat, avec la version de l'algorithme, pour pouvoir l'expliquer.
-- Aucune donnée personnelle : identifiant de candidature, résultat et empreinte des données utilisées.
create table public.score_audit_log (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  algo_version text not null,
  score int not null,
  segments int not null,
  badge text not null,
  inputs_hash text not null,
  created_at timestamptz not null default now()
);
create index on public.score_audit_log (application_id);

create function public.is_application_company_member(p_application uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.applications a where a.id = p_application and public.is_listing_company_member(a.listing_id));
$$;

create function public.company_has_feature(p_company uuid, p_feature text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select pf.enabled from public.companies c join public.plan_features pf on pf.plan = c.plan
    where c.id = p_company and pf.feature_key = p_feature
  ), false);
$$;
grant execute on function public.is_application_company_member(uuid), public.company_has_feature(uuid, text) to authenticated;

alter table public.match_scores enable row level security;
alter table public.score_audit_log enable row level security;

-- La jauge n'est visible que par l'entreprise. Aucune policy pour les élèves.
-- Écriture : service role uniquement (Edge Function), aucun grant d'écriture pour authenticated.
grant select on public.match_scores to authenticated;
create policy "jauge: lecture entreprise" on public.match_scores for select to authenticated
  using (public.is_application_company_member(application_id));
-- score_audit_log : aucune policy, aucun grant -> service role uniquement.

-- Les pondérations sont transparentes pour l'élève (nécessaires au calcul de compatibilité).
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
       or exists (select 1 from public.applications a where a.listing_id = l.id and a.student_id = auth.uid()));
