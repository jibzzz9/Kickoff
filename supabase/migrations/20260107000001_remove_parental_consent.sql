-- Retrait de l'accord parental par email (décision du porteur du projet) :
-- plus d'email du parent à l'inscription, plus de compte limité pour les moins de 16 ans.
-- L'accès en lecture parent/enseignant, à l'initiative de l'élève, est conservé.

drop trigger if exists students_parent_consent on public.students;
drop function if exists public.request_parent_consent();

-- Candidature : l'élève peut postuler dès son inscription.
drop policy "candidature: envoi" on public.applications;
create policy "candidature: envoi" on public.applications for insert to authenticated
  with check (
    student_id = auth.uid()
    and status = 'sent'
    and public.listing_is_public(listing_id)
    and (cv_document_id is null or exists (
      select 1 from public.student_documents d where d.id = cv_document_id and d.student_id = auth.uid()
    ))
  );
drop function public.student_can_apply();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role;
  v_locale public.app_locale;
  v_company uuid;
begin
  v_role := case meta ->> 'role' when 'company_user' then 'company_user' when 'parent' then 'parent' else 'student' end;
  v_locale := case meta ->> 'locale' when 'de' then 'de' else 'fr' end;

  insert into public.profiles (id, role, locale) values (new.id, v_role, v_locale);

  if v_role = 'student' then
    insert into public.students (profile_id, first_name, birth_date, commune, ai_notice_accepted_at)
    values (new.id, meta ->> 'first_name', (meta ->> 'birth_date')::date, meta ->> 'commune', now());
  elsif v_role = 'company_user' then
    insert into public.companies (name, ide_number, commune)
    values (meta ->> 'company_name', nullif(meta ->> 'ide_number', ''), meta ->> 'commune')
    returning id into v_company;
    insert into public.company_members (company_id, profile_id, role, contact_name)
    values (v_company, new.id, 'admin', meta ->> 'contact_name');
  end if;
  return new;
end $$;

drop table public.parental_consents;
alter table public.students
  drop column parental_consent,
  drop column parental_consent_at,
  drop column parent_email;
drop function public.min_parent_consent_age();
delete from public.app_settings where key = 'min_age_without_parent_consent';
drop type public.consent_status;
