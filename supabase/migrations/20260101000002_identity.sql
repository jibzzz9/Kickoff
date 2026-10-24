-- Profils, élèves, entreprises, consentements. Création automatique à l'inscription.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  locale public.app_locale not null default 'fr',
  created_at timestamptz not null default now()
);

create table public.students (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  birth_date date not null,
  commune text not null,
  school_year text,
  grades jsonb not null default '{}',
  aptitude_tests jsonb not null default '[]',
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  soft_skills text[] not null default '{}',
  parental_consent public.consent_status not null default 'not_required',
  parental_consent_at timestamptz,
  parent_email text,
  ai_notice_accepted_at timestamptz,
  checkup_frequency_days int not null default 14 check (checkup_frequency_days in (7, 14, 21, 30)),
  plan public.student_plan not null default 'free',
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 150),
  ide_number text,
  address text,
  commune text not null,
  plan public.company_plan not null default 'pro', -- MVP : Pro gratuit pour les entreprises pilotes
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.company_role not null default 'trainer',
  contact_name text,
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);
create index on public.company_members (profile_id);

-- Consentement parental : géré uniquement côté serveur (service role).
create table public.parental_consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  parent_email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Accès parent / enseignant en lecture seule, révocable par l'élève.
create table public.guardians_access (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  guardian_email text not null,
  guardian_profile_id uuid references public.profiles (id) on delete set null,
  token_hash text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- ---------- Fonctions utilitaires ----------
create function public.min_parent_consent_age() returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = 'min_age_without_parent_consent'), 16);
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.is_company_member(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where company_id = p_company and profile_id = auth.uid());
$$;

create function public.is_company_admin(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where company_id = p_company and profile_id = auth.uid() and role = 'admin');
$$;

grant execute on function public.min_parent_consent_age(), public.is_admin(),
  public.is_company_member(uuid), public.is_company_admin(uuid) to authenticated;

-- ---------- Création de profil à l'inscription ----------
-- Les métadonnées d'inscription viennent du client : le rôle est limité à student / company_user,
-- et le statut de consentement parental est calculé ici, jamais fourni par le client.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role;
  v_locale public.app_locale;
  v_birth date;
  v_company uuid;
begin
  v_role := case meta ->> 'role' when 'company_user' then 'company_user' else 'student' end;
  v_locale := case meta ->> 'locale' when 'de' then 'de' else 'fr' end;

  insert into public.profiles (id, role, locale) values (new.id, v_role, v_locale);

  if v_role = 'student' then
    v_birth := (meta ->> 'birth_date')::date;
    insert into public.students (profile_id, first_name, birth_date, commune, parent_email, parental_consent, ai_notice_accepted_at)
    values (
      new.id,
      meta ->> 'first_name',
      v_birth,
      meta ->> 'commune',
      meta ->> 'parent_email',
      case when extract(year from age(current_date, v_birth)) < public.min_parent_consent_age()
           then 'pending' else 'not_required' end::public.consent_status,
      now()
    );
  else
    insert into public.companies (name, ide_number, commune)
    values (meta ->> 'company_name', nullif(meta ->> 'ide_number', ''), meta ->> 'commune')
    returning id into v_company;
    insert into public.company_members (company_id, profile_id, role, contact_name)
    values (v_company, new.id, 'admin', meta ->> 'contact_name');
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.parental_consents enable row level security;
alter table public.guardians_access enable row level security;

-- profiles : lecture du sien ; seule la langue est modifiable (pas le rôle).
grant select on public.profiles to authenticated;
grant update (locale) on public.profiles to authenticated;
create policy "profil: lecture" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profil: modif" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- students : l'élève uniquement ; le statut de consentement n'est pas modifiable par le client.
grant select on public.students to authenticated;
grant update (first_name, commune, school_year, grades, aptitude_tests, languages, interests,
              soft_skills, checkup_frequency_days) on public.students to authenticated;
create policy "élève: lecture" on public.students for select to authenticated using (profile_id = auth.uid());
create policy "élève: modif" on public.students for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- companies : visibles et modifiables (champs limités) par leurs membres ; le plan et la vérification restent serveur.
grant select on public.companies to authenticated;
grant update (name, ide_number, address, commune) on public.companies to authenticated;
create policy "entreprise: lecture" on public.companies for select to authenticated
  using (public.is_company_member(id));
create policy "entreprise: modif par admin" on public.companies for update to authenticated
  using (public.is_company_admin(id)) with check (public.is_company_admin(id));

-- company_members : les membres voient leur équipe.
grant select on public.company_members to authenticated;
create policy "équipe: lecture" on public.company_members for select to authenticated
  using (public.is_company_member(company_id));

-- parental_consents : aucune policy, aucun grant -> service role uniquement.

-- guardians_access : l'élève gère ses accès.
grant select, insert on public.guardians_access to authenticated;
grant update (revoked_at) on public.guardians_access to authenticated;
create policy "accès parent: lecture" on public.guardians_access for select to authenticated
  using (student_id = auth.uid() or guardian_profile_id = auth.uid());
create policy "accès parent: création" on public.guardians_access for insert to authenticated
  with check (student_id = auth.uid());
create policy "accès parent: révocation" on public.guardians_access for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
