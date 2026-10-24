-- Phase 1 : communes, annonces + critères, documents élève, candidatures.

create type public.listing_status as enum ('draft', 'open', 'filled', 'closed');
create type public.criterion_kind as enum ('required', 'bonus');
create type public.application_status as enum (
  'sent', 'followed_up', 'trial', 'interview', 'offer', 'accepted', 'declined', 'not_this_time', 'waitlist', 'withdrawn'
);
create type public.document_kind as enum ('cv', 'letter', 'video');

-- ---------- Communes (données de référence, coordonnées approximatives du centre) ----------
create table public.communes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  canton text not null default 'VS',
  language public.app_locale not null,
  lat double precision not null,
  lng double precision not null
);
insert into public.communes (code, name, language, lat, lng) values
  ('sion', 'Sion', 'fr', 46.2331, 7.3606),
  ('sierre', 'Sierre', 'fr', 46.2920, 7.5326),
  ('martigny', 'Martigny', 'fr', 46.1028, 7.0726),
  ('monthey', 'Monthey', 'fr', 46.2550, 6.9540),
  ('conthey', 'Conthey', 'fr', 46.2236, 7.3036),
  ('saviese', 'Savièse', 'fr', 46.2520, 7.3460),
  ('fully', 'Fully', 'fr', 46.1380, 7.1140),
  ('collombey-muraz', 'Collombey-Muraz', 'fr', 46.2730, 6.9480),
  ('saint-maurice', 'Saint-Maurice', 'fr', 46.2180, 7.0030),
  ('val-de-bagnes', 'Val de Bagnes', 'fr', 46.0800, 7.2120),
  ('crans-montana', 'Crans-Montana', 'fr', 46.3110, 7.4810),
  ('nendaz', 'Nendaz', 'fr', 46.1870, 7.2930),
  ('vetroz', 'Vétroz', 'fr', 46.2200, 7.2780),
  ('saxon', 'Saxon', 'fr', 46.1500, 7.1750),
  ('chamoson', 'Chamoson', 'fr', 46.2020, 7.2240),
  ('riddes', 'Riddes', 'fr', 46.1720, 7.2240),
  ('grone', 'Grône', 'fr', 46.2520, 7.4590),
  ('chalais', 'Chalais', 'fr', 46.2660, 7.5080),
  ('ayent', 'Ayent', 'fr', 46.2780, 7.4130),
  ('vouvry', 'Vouvry', 'fr', 46.3370, 6.8900),
  ('orsieres', 'Orsières', 'fr', 46.0290, 7.1460),
  ('brig-glis', 'Brig-Glis', 'de', 46.3159, 7.9878),
  ('visp', 'Visp', 'de', 46.2937, 7.8815),
  ('naters', 'Naters', 'de', 46.3254, 7.9897),
  ('leuk', 'Leuk', 'de', 46.3170, 7.6340),
  ('steg-hohtenn', 'Steg-Hohtenn', 'de', 46.3150, 7.7480),
  ('raron', 'Raron', 'de', 46.3120, 7.8000),
  ('salgesch', 'Salgesch', 'de', 46.3110, 7.5710),
  ('zermatt', 'Zermatt', 'de', 46.0207, 7.7491),
  ('saas-fee', 'Saas-Fee', 'de', 46.1080, 7.9270);

alter table public.communes enable row level security;
grant select on public.communes to anon, authenticated;
create policy "lecture communes" on public.communes for select to anon, authenticated using (true);

-- Les métiers sont aussi lisibles avant connexion (écran d'inscription).
grant select on public.professions to anon;
create policy "lecture métiers (anon)" on public.professions for select to anon using (active);

-- ---------- Champs élève utilisés par les critères ----------
alter table public.students
  add column commune_id uuid references public.communes (id),
  add column trial_internships jsonb not null default '[]',
  add column has_moped_license boolean not null default false,
  add column does_volunteering boolean not null default false;
grant update (commune_id, trial_internships, has_moped_license, does_volunteering) on public.students to authenticated;

-- commune_id fait foi quand il est renseigné ; sinon on le retrouve depuis le nom saisi.
create function public.sync_student_commune() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.commune_id is not null and (tg_op = 'INSERT' or new.commune_id is distinct from old.commune_id) then
    new.commune := coalesce((select name from public.communes where id = new.commune_id), new.commune);
  elsif tg_op = 'INSERT' or new.commune is distinct from old.commune then
    new.commune_id := (select id from public.communes where lower(name) = lower(trim(new.commune)) limit 1);
  end if;
  return new;
end $$;
create trigger students_sync_commune before insert or update on public.students
  for each row execute function public.sync_student_commune();

-- ---------- Annonces ----------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  profession_id uuid not null references public.professions (id),
  commune_id uuid not null references public.communes (id),
  address text,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) <= 4000),
  start_date date not null,
  places_count int not null default 1 check (places_count between 1 and 50),
  contact_name text,
  contact_email text,
  trial_dates date[] not null default '{}',
  weights jsonb not null default '{"motivation":2,"grades":2,"soft_skills":2,"practical_experience":2}',
  status public.listing_status not null default 'open',
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.listings (company_id);
create index on public.listings (status);

create table public.listing_criteria (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  kind public.criterion_kind not null,
  key text not null check (key in ('trial_done', 'min_average', 'aptitude_test', 'languages', 'moped_license', 'volunteering')),
  value jsonb not null default 'true',
  unique (listing_id, kind, key)
);

-- ---------- Documents élève (fichiers dans le bucket privé student-documents) ----------
create table public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  kind public.document_kind not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes int not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);
create index on public.student_documents (student_id);

-- ---------- Candidatures ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  status public.application_status not null default 'sent',
  cover_letter text check (char_length(cover_letter) <= 5000),
  cv_document_id uuid references public.student_documents (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, listing_id)
);
create index on public.applications (listing_id);

-- ---------- Fonctions d'accès ----------
create function public.listing_is_public(p_listing uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.listings l join public.companies c on c.id = l.company_id
    where l.id = p_listing and l.status = 'open' and c.verified_at is not null
  );
$$;

create function public.is_listing_company_member(p_listing uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.listings l where l.id = p_listing and public.is_company_member(l.company_id));
$$;

-- Un élève dont le consentement parental est en attente a un compte limité : il ne peut pas postuler.
create function public.student_can_apply() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students where profile_id = auth.uid() and parental_consent <> 'pending');
$$;

-- Une entreprise ne lit un document que s'il est joint à une candidature reçue sur une de ses annonces.
create function public.company_can_read_document(p_path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.student_documents d
    join public.applications a on a.cv_document_id = d.id
    join public.listings l on l.id = a.listing_id
    where d.storage_path = p_path and a.status <> 'withdrawn' and public.is_company_member(l.company_id)
  );
$$;

grant execute on function public.listing_is_public(uuid), public.is_listing_company_member(uuid),
  public.student_can_apply(), public.company_can_read_document(text) to authenticated;

-- Création atomique d'une annonce et de ses critères (RLS appliquée : security invoker).
create function public.create_listing(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid;
  c jsonb;
begin
  insert into public.listings (company_id, profession_id, commune_id, address, title, description, start_date,
                               places_count, contact_name, contact_email, trial_dates, weights)
  values (
    (p ->> 'company_id')::uuid,
    (p ->> 'profession_id')::uuid,
    (p ->> 'commune_id')::uuid,
    nullif(p ->> 'address', ''),
    p ->> 'title',
    p ->> 'description',
    (p ->> 'start_date')::date,
    coalesce((p ->> 'places_count')::int, 1),
    p ->> 'contact_name',
    nullif(p ->> 'contact_email', ''),
    coalesce(array(select jsonb_array_elements_text(p -> 'trial_dates'))::date[], '{}'),
    coalesce(p -> 'weights', '{"motivation":2,"grades":2,"soft_skills":2,"practical_experience":2}'::jsonb)
  )
  returning id into v_id;

  for c in select * from jsonb_array_elements(coalesce(p -> 'criteria', '[]'::jsonb)) loop
    insert into public.listing_criteria (listing_id, kind, key, value)
    values (v_id, (c ->> 'kind')::public.criterion_kind, c ->> 'key', coalesce(c -> 'value', 'true'::jsonb));
  end loop;
  return v_id;
end $$;
grant execute on function public.create_listing(jsonb) to authenticated;

-- ---------- RLS ----------
alter table public.listings enable row level security;
alter table public.listing_criteria enable row level security;
alter table public.student_documents enable row level security;
alter table public.applications enable row level security;

-- listings : gérées par les membres de l'entreprise. Les élèves passent par la vue listing_cards.
grant select, insert, update on public.listings to authenticated;
create policy "annonce: lecture entreprise" on public.listings for select to authenticated
  using (public.is_company_member(company_id));
create policy "annonce: création" on public.listings for insert to authenticated
  with check (public.is_company_member(company_id));
create policy "annonce: modif" on public.listings for update to authenticated
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));

-- listing_criteria : gérés par l'entreprise, visibles par tous pour une annonce publique (transparence).
grant select, insert, update, delete on public.listing_criteria to authenticated;
create policy "critères: lecture" on public.listing_criteria for select to authenticated
  using (public.is_listing_company_member(listing_id) or public.listing_is_public(listing_id));
create policy "critères: création" on public.listing_criteria for insert to authenticated
  with check (public.is_listing_company_member(listing_id));
create policy "critères: modif" on public.listing_criteria for update to authenticated
  using (public.is_listing_company_member(listing_id)) with check (public.is_listing_company_member(listing_id));
create policy "critères: suppression" on public.listing_criteria for delete to authenticated
  using (public.is_listing_company_member(listing_id));

-- student_documents : l'élève gère les siens ; l'entreprise lit ceux joints à une candidature reçue.
grant select, insert, delete on public.student_documents to authenticated;
create policy "documents: lecture" on public.student_documents for select to authenticated
  using (student_id = auth.uid() or public.company_can_read_document(storage_path));
create policy "documents: ajout" on public.student_documents for insert to authenticated
  with check (student_id = auth.uid() and storage_path like auth.uid()::text || '/%');
create policy "documents: suppression" on public.student_documents for delete to authenticated
  using (student_id = auth.uid());

-- applications : l'élève voit et crée les siennes ; l'entreprise voit celles reçues sur ses annonces.
grant select, insert on public.applications to authenticated;
create policy "candidature: lecture élève" on public.applications for select to authenticated
  using (student_id = auth.uid());
create policy "candidature: lecture entreprise" on public.applications for select to authenticated
  using (public.is_listing_company_member(listing_id));
create policy "candidature: envoi" on public.applications for insert to authenticated
  with check (
    student_id = auth.uid()
    and status = 'sent'
    and public.listing_is_public(listing_id)
    and public.student_can_apply()
    and (cv_document_id is null or exists (
      select 1 from public.student_documents d where d.id = cv_document_id and d.student_id = auth.uid()
    ))
  );

-- ---------- Vues ----------
-- Annonces visibles par les élèves : ouvertes et d'une entreprise vérifiée,
-- plus celles où l'élève a déjà postulé (pour son suivi). Champs choisis, sans données internes.
create view public.listing_cards with (security_barrier = true) as
select
  l.id, l.title, l.description, l.start_date, l.places_count, l.trial_dates, l.status, l.address,
  l.contact_name, l.created_at,
  c.name as company_name,
  p.id as profession_id, p.code as profession_code, p.name_fr as profession_name_fr, p.name_de as profession_name_de,
  m.id as commune_id, m.name as commune_name, m.lat, m.lng
from public.listings l
join public.companies c on c.id = l.company_id
join public.professions p on p.id = l.profession_id
join public.communes m on m.id = l.commune_id
where c.verified_at is not null
  and (l.status = 'open'
       or exists (select 1 from public.applications a where a.listing_id = l.id and a.student_id = auth.uid()));

-- Carte candidat vue par l'entreprise : uniquement pour les candidatures reçues sur ses annonces.
-- Aucun nom de famille (non collecté), âge au lieu de la date de naissance, commune au lieu de l'adresse.
create view public.candidate_cards with (security_barrier = true) as
select
  a.id as application_id, a.listing_id, a.status, a.cover_letter, a.created_at,
  s.first_name,
  date_part('year', age(s.birth_date))::int as age,
  s.commune, s.school_year, s.grades, s.aptitude_tests, s.trial_internships, s.languages,
  s.interests, s.soft_skills, s.has_moped_license, s.does_volunteering,
  d.storage_path as cv_path, d.file_name as cv_file_name
from public.applications a
join public.listings l on l.id = a.listing_id
join public.students s on s.profile_id = a.student_id
left join public.student_documents d on d.id = a.cv_document_id
where public.is_company_member(l.company_id) and a.status <> 'withdrawn';

revoke all on public.listing_cards, public.candidate_cards from anon, public;
grant select on public.listing_cards, public.candidate_cards to authenticated;

-- ---------- Temps réel ----------
alter publication supabase_realtime add table public.applications;

-- ---------- Stockage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-documents', 'student-documents', false, 10485760, array['application/pdf', 'video/mp4', 'video/quicktime']);

create policy "fichiers élève: lecture" on storage.objects for select to authenticated
  using (bucket_id = 'student-documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.company_can_read_document(name)));
create policy "fichiers élève: envoi" on storage.objects for insert to authenticated
  with check (bucket_id = 'student-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fichiers élève: suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = auth.uid()::text);
