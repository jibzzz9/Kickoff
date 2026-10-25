begin;
select plan(15);

-- 1. RLS activée sur toutes les tables du schéma public
select is(
  (select count(*)::int from pg_tables t
   where schemaname = 'public'
     and not (select relrowsecurity from pg_class where oid = ('public.' || t.tablename)::regclass)),
  0, 'RLS activée sur toutes les tables publiques');

-- Données de test (le trigger crée profils / élèves / entreprises)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adulte@test.ch',
   jsonb_build_object('role','student','first_name','Anna','birth_date', (current_date - interval '17 years')::date::text,'commune','Sion')),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jeune@test.ch',
   jsonb_build_object('role','student','first_name','Ben','birth_date', (current_date - interval '14 years')::date::text,'commune','Brig')),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'garage@test.ch',
   jsonb_build_object('role','company_user','company_name','Garage Alpin','commune','Brig','contact_name','Marc')),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pharma@test.ch',
   jsonb_build_object('role','admin','first_name','Eve','birth_date','2005-01-01','commune','Sion'));

-- 2. Trigger d'inscription
select is((select first_name from public.students where profile_id = '00000000-0000-0000-0000-0000000000a1'),
  'Anna', 'inscription élève (17 ans): dossier créé');
select is((select first_name from public.students where profile_id = '00000000-0000-0000-0000-0000000000a2'),
  'Ben', 'inscription élève (14 ans): dossier créé, sans email parental');
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'),
  'student', 'role=admin dans les métadonnées client est ignoré');
select is((select count(*)::int from public.company_members where profile_id = '00000000-0000-0000-0000-0000000000b1' and role = 'admin'),
  1, 'inscription entreprise: premier membre = admin');

-- Élève A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select count(*)::int from public.students), 1, 'élève: ne voit que son propre dossier');
select is((select count(*)::int from public.companies), 0, 'élève: ne voit aucune entreprise');
select lives_ok($$update public.students set commune = 'Martigny' where profile_id = auth.uid()$$, 'élève: peut modifier sa commune');
select throws_ok($$update public.students set birth_date = '2000-01-01' where profile_id = auth.uid()$$,
  '42501', null, 'élève: ne peut pas modifier sa date de naissance');
select throws_ok($$update public.profiles set role = 'admin' where id = auth.uid()$$,
  '42501', null, 'élève: ne peut pas changer son rôle');
select throws_ok($$update public.app_settings set value = '0'$$, '42501', null, 'élève: ne peut pas modifier les réglages');

-- Entreprise Garage Alpin
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select is((select count(*)::int from public.companies), 1, 'entreprise: ne voit que la sienne');
select is((select count(*)::int from public.students), 0, 'entreprise: ne voit aucun élève (pas de candidature)');
select throws_ok($$update public.companies set plan = 'pro', verified_at = now()$$, '42501', null,
  'entreprise: ne peut pas se vérifier elle-même ni changer de plan');
select is((select count(*)::int from public.professions), 3, 'métiers lisibles par les utilisateurs connectés');

reset role;
select * from finish();
rollback;
