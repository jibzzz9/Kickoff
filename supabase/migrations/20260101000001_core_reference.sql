-- Types de base, réglages, métiers, feature flags par plan.

create type public.user_role as enum ('student', 'company_user', 'parent', 'admin');
create type public.app_locale as enum ('fr', 'de');
create type public.company_role as enum ('admin', 'trainer');
create type public.company_plan as enum ('basic', 'pro');
create type public.student_plan as enum ('free', 'plus');
create type public.consent_status as enum ('not_required', 'pending', 'granted');
create type public.profession_type as enum ('CFC', 'AFP');

-- Par défaut, aucun droit pour anon/authenticated sur les nouvelles tables :
-- chaque table reçoit des GRANT explicites + RLS.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text
);
insert into public.app_settings (key, value, description) values
  ('min_age_without_parent_consent', '16', 'Âge en dessous duquel le consentement parental est requis (à confirmer avec un juriste)');

create table public.plan_features (
  plan public.company_plan not null,
  feature_key text not null,
  enabled boolean not null default false,
  primary key (plan, feature_key)
);
insert into public.plan_features (plan, feature_key, enabled) values
  ('basic', 'publish_listings', true),
  ('basic', 'receive_applications', true),
  ('basic', 'ai_gauge', false),
  ('basic', 'one_click_actions', false),
  ('basic', 'trial_management', false),
  ('basic', 'stats', false),
  ('pro', 'publish_listings', true),
  ('pro', 'receive_applications', true),
  ('pro', 'ai_gauge', true),
  ('pro', 'one_click_actions', true),
  ('pro', 'trial_management', true),
  ('pro', 'stats', true);

create table public.professions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_fr text not null,
  name_de text not null,
  type public.profession_type not null,
  active boolean not null default true
);
insert into public.professions (code, name_fr, name_de, type) values
  ('assc', 'Assistant·e en soins et santé communautaire', 'Fachperson Gesundheit EFZ', 'CFC'),
  ('employe-commerce', 'Employé·e de commerce', 'Kauffrau/Kaufmann EFZ', 'CFC'),
  ('logisticien', 'Logisticien·ne', 'Logistiker/in EFZ', 'CFC');

alter table public.app_settings enable row level security;
alter table public.plan_features enable row level security;
alter table public.professions enable row level security;

grant select on public.app_settings, public.plan_features, public.professions to authenticated;
create policy "lecture réglages" on public.app_settings for select to authenticated using (true);
create policy "lecture features" on public.plan_features for select to authenticated using (true);
create policy "lecture métiers" on public.professions for select to authenticated using (active);
